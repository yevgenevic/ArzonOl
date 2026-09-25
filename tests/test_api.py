"""Regression tests against a real server and a disposable SQLite database."""
from contextlib import closing
import concurrent.futures
import http.cookies
import json
import os
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


class APIRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix='arzonol-test-')
        cls.db = Path(cls.tmp.name) / 'test.db'
        cls.env = {**os.environ, 'ARZONOL_LOAD_ENV': '0', 'ARZONOL_DB_PATH': str(cls.db), 'OPENROUTER_API_KEY': ''}
        subprocess.run([sys.executable, 'seed.py'], cwd=ROOT/'backend', env=cls.env, check=True, stdout=subprocess.DEVNULL)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cls.port = sock.getsockname()[1]
        cls.base = f'http://127.0.0.1:{cls.port}'
        cls.log = open(Path(cls.tmp.name)/'server.log', 'w+')
        cls.proc = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', str(cls.port)], cwd=ROOT/'backend', env=cls.env, stdout=cls.log, stderr=cls.log)
        for _ in range(100):
            try:
                if cls.request('/api/health')[0] == 200:
                    break
            except urllib.error.URLError:
                time.sleep(.05)
        else:
            cls.proc.terminate(); cls.proc.wait(); cls.log.seek(0)
            raise RuntimeError(cls.log.read())
        cls.cookies = []
        for i in range(3):
            status, data, headers = cls.request('/api/auth/register', {'email': f'person{i}@example.com','password':'TestPassword123','name':'<b>Test</b>'})
            assert status == 200, (status, data)
            cls.cookies.append(headers['Set-Cookie'].split(';')[0])
        with closing(sqlite3.connect(cls.db)) as conn, conn:
            conn.execute("UPDATE users SET is_admin=1 WHERE email='person0@example.com'")
        cls.admin, cls.member, cls.other = cls.cookies

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate(); cls.proc.wait(timeout=10)
        cls.log.close(); cls.tmp.cleanup()

    @classmethod
    def request(cls, path, body=None, cookie=None, method=None, headers=None):
        hdr = {'Content-Type':'application/json', **(headers or {})}
        if cookie: hdr['Cookie'] = cookie
        req = urllib.request.Request(cls.base+path, data=json.dumps(body).encode() if body is not None else None, headers=hdr, method=method)
        try:
            response = urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read().decode('utf-8', 'replace')
            try: data = json.loads(raw)
            except ValueError: data = raw
            return response.status, data, response.headers

    def test_public_catalog_and_assets_never_expose_secrets(self):
        with closing(sqlite3.connect(self.db)) as conn, conn:
            conn.execute("UPDATE platforms SET api_key='FAKE_TEST_SECRET',feed_url='https://example.invalid/private' WHERE id='uzum'")
        status, body, headers = self.request('/api/catalog')
        self.assertEqual(status, 200)
        for platform in body['platforms']:
            self.assertEqual(set(platform), {'id','name','color','site_url'})
        self.assertNotIn('FAKE_TEST_SECRET', json.dumps(body))
        self.assertEqual(headers['Cache-Control'], 'no-store')
        for path in ('/backend/.env','/backend/arzonol.db','/.git/config','/backend/demo_catalog.json','/assets/%2e%2e/backend/.env','/%2e%2e/etc/passwd','/assets/js/../../backend/demo_catalog.json'):
            self.assertEqual(self.request(path)[0], 404, path)
        self.assertNotIn('DEFAULT_PRODUCTS', self.request('/assets/js/data.js')[1])

    def test_cookie_auth_and_access_control(self):
        status, body, headers = self.request('/api/auth/login', {'email':'person1@example.com','password':'TestPassword123'})
        self.assertEqual(status, 200)
        self.assertNotIn('token', body)
        self.assertIn('HttpOnly', headers['Set-Cookie'])
        self.assertIn('SameSite=strict', headers['Set-Cookie'])
        self.assertEqual(self.request('/api/auth/me', cookie=self.member)[0], 200)
        self.assertEqual(self.request('/api/stats/full')[0], 401)
        self.assertEqual(self.request('/api/stats/full', cookie=self.member)[0], 403)
        self.assertEqual(self.request('/api/stats/full', cookie=self.admin)[0], 200)
        self.assertEqual(self.request('/api/tracked', {'product_id':'t01'}, self.member, headers={'Origin':'https://other.invalid'})[0], 403)
        self.assertEqual(self.request('/api/auth/login', {'email':'person1@example.com','password':'TestPassword123'}, headers={'Origin':'null'})[0], 403)

    def test_guest_filters_have_availability_without_prices(self):
        status, guest, _ = self.request('/api/products')
        self.assertEqual(status, 200)
        self.assertFalse(guest['unlocked'])
        self.assertEqual(len(guest['products']), 36)
        self.assertTrue(any(p['availability'] for p in guest['products']))
        for p in guest['products']:
            self.assertEqual(p['offers'], [])
            self.assertEqual(p['history'], [])
            for offer in p['availability']:
                self.assertEqual(set(offer), {'platform','inStock'})
        self.assertTrue(self.request('/api/products',cookie=self.member)[1]['unlocked'])

    def test_validation_and_atomic_comparison(self):
        for price in (-1, 0, 10**13):
            self.assertEqual(self.request('/api/tracked',{'product_id':'t01','target_price':price},self.member)[0],422)
        self.assertEqual(self.request('/api/tracked',{'product_id':'missing'},self.member)[0],404)
        self.assertEqual(self.request('/api/analytics/view/missing',{},self.member)[0],404)
        self.assertEqual(self.request('/api/compare',['t01'],self.member,method='PUT')[0],200)
        self.assertEqual(self.request('/api/compare',['missing'],self.member,method='PUT')[0],404)
        self.assertEqual(self.request('/api/compare',cookie=self.member)[1]['compare'],['t01'])
        self.assertEqual(self.request('/api/compare',['t01']*5,self.member,method='PUT')[0],422)
        self.assertEqual(self.request('/api/profile',{'region':'missing'},self.member,method='PUT')[0],422)
        self.assertEqual(self.request('/api/admin/platforms/create',{'id':"x');alert(1)",'name':'Bad','color':'#000000'},self.admin)[0],422)
        self.assertEqual(self.request('/api/admin/platforms/create',{'id':'bad-url','name':'Bad','color':'#000000','site_url':'javascript:alert(1)'},self.admin)[0],422)

    def test_seed_preserves_activity_and_integration_settings(self):
        self.request('/api/tracked',{'product_id':'t02','target_price':12345},self.member)
        self.request('/api/compare',['t02'],self.member,method='PUT')
        self.request('/api/analytics/view/t02',{},self.member)
        with closing(sqlite3.connect(self.db)) as conn, conn:
            conn.execute("UPDATE platforms SET api_key='PRESERVE',feed_url='https://example.invalid/feed',sync_interval=120 WHERE id='uzum'")
            conn.execute("INSERT INTO sync_logs(platform_id,status,message) VALUES ('uzum','demo','keep')")
            tables=['users','sessions','tracked_products','compare_items','product_views','sync_logs','offers','price_history','product_images']
            before={t:conn.execute('SELECT * FROM '+t+' ORDER BY rowid').fetchall() for t in tables}
        for _ in range(2):
            subprocess.run([sys.executable,'seed.py'],cwd=ROOT/'backend',env=self.env,check=True,stdout=subprocess.DEVNULL)
        with closing(sqlite3.connect(self.db)) as conn, conn:
            after={t:conn.execute('SELECT * FROM '+t+' ORDER BY rowid').fetchall() for t in tables}
            self.assertEqual(before,after)
            self.assertEqual(conn.execute("SELECT api_key,sync_interval FROM platforms WHERE id='uzum'").fetchone(),('PRESERVE',120))

    def test_demo_sync_does_not_claim_fresh_prices(self):
        with closing(sqlite3.connect(self.db)) as conn, conn:
            before=conn.execute('SELECT id,price,updated_at FROM offers ORDER BY id').fetchall()
            last=conn.execute("SELECT last_sync_at FROM platforms WHERE id='uzum'").fetchone()
        status,body,_=self.request('/api/admin/integrations/test',{'platform_id':'uzum','feed_url':'https://example.invalid/feed','integration_type':'feed'},self.admin)
        self.assertEqual(status,200); self.assertTrue(body['demo']); self.assertIsNone(body['latency_ms'])
        for route in ('/api/admin/integrations/sync/uzum','/api/admin/integrations/sync-all'):
            status,body,_=self.request(route,{},self.admin)
            self.assertEqual(status,200); self.assertTrue(body['demo'])
        with closing(sqlite3.connect(self.db)) as conn, conn:
            self.assertEqual(before,conn.execute('SELECT id,price,updated_at FROM offers ORDER BY id').fetchall())
            self.assertEqual(last,conn.execute("SELECT last_sync_at FROM platforms WHERE id='uzum'").fetchone())

    def test_price_advisor_without_key_and_without_history(self):
        with closing(sqlite3.connect(self.db)) as conn, conn:
            saved=conn.execute("SELECT product_id,period,price FROM price_history WHERE product_id='t01'").fetchall()
            conn.execute("DELETE FROM price_history WHERE product_id='t01'")
        try:
            status,body,_=self.request('/api/ai/price-advisor/t01',cookie=self.member)
            self.assertEqual(status,200)
            self.assertEqual(body['status'],'insufficient_data')
            self.assertIsNone(body['avg_price']); self.assertIsNone(body['diff_pct'])
            self.assertNotIn('10%',body['advice'])
            with closing(sqlite3.connect(self.db)) as conn, conn:
                price=conn.execute("SELECT MIN(price) FROM offers WHERE product_id='t01' AND in_stock=1").fetchone()[0]
                conn.executemany('INSERT INTO price_history(product_id,period,price) VALUES (?,?,?)',[('t01','2026-01',price),('t01','2026-02',price)])
            body=self.request('/api/ai/price-advisor/t01',cookie=self.member)[1]
            self.assertEqual(body['status'],'fair_price')
            self.assertEqual(body['diff_pct'],0)
        finally:
            with closing(sqlite3.connect(self.db)) as conn, conn:
                conn.execute("DELETE FROM price_history WHERE product_id='t01'")
                conn.executemany('INSERT INTO price_history(product_id,period,price) VALUES (?,?,?)',saved)

    def test_concurrent_requests_preserve_user_isolation(self):
        def write(i):
            cookie=self.member if i%2 else self.other
            return self.request('/api/tracked',{'product_id':'t03','target_price':111 if i%2 else 222},cookie)[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            self.assertEqual(list(pool.map(write,range(30))),[200]*30)
        for cookie,price in [(self.member,111),(self.other,222)]:
            rows=self.request('/api/tracked',cookie=cookie)[1]['tracked']
            self.assertEqual(next(r['target_price'] for r in rows if r['product_id']=='t03'),price)

    def test_logout_revokes_cookie(self):
        status,_,headers=self.request('/api/auth/login',{'email':'person2@example.com','password':'TestPassword123'})
        cookie=headers['Set-Cookie'].split(';')[0]
        self.assertEqual(self.request('/api/auth/logout',{},cookie)[0],200)
        self.assertEqual(self.request('/api/auth/me',cookie=cookie)[0],401)

    def test_password_change_revokes_other_sessions(self):
        sessions=[]
        for _ in range(2):
            status,_,headers=self.request('/api/auth/login',{'email':'person2@example.com','password':'TestPassword123'})
            self.assertEqual(status,200)
            sessions.append(headers['Set-Cookie'].split(';')[0])
        self.assertEqual(self.request('/api/profile/password',{'current_password':'TestPassword123','new_password':'ChangedPassword123'},sessions[0])[0],200)
        self.assertEqual(self.request('/api/auth/me',cookie=sessions[0])[0],200)
        self.assertEqual(self.request('/api/auth/me',cookie=sessions[1])[0],401)
        self.assertEqual(self.request('/api/profile/password',{'current_password':'ChangedPassword123','new_password':'TestPassword123'},sessions[0])[0],200)

    def test_demo_users_do_not_replace_existing_accounts(self):
        with closing(sqlite3.connect(self.db)) as conn:
            before=conn.execute('SELECT * FROM users ORDER BY id').fetchall()
        subprocess.run([sys.executable,'seed_demo.py'],cwd=ROOT/'backend',env=self.env,check=True,stdout=subprocess.DEVNULL)
        with closing(sqlite3.connect(self.db)) as conn:
            self.assertEqual(before,conn.execute('SELECT * FROM users ORDER BY id').fetchall())

    def test_z_auth_rate_limit(self):
        statuses=[self.request('/api/auth/login',{'email':'nobody@example.com','password':'wrong'})[0] for _ in range(22)]
        self.assertIn(429,statuses)


if __name__ == '__main__': unittest.main()
