"""Safely upsert the demo catalogue without deleting users or their activity.

The fixture is server-only. Existing products, integration settings and history
remain intact; rerunning this command adds missing data and updates descriptions.
"""
import json
from pathlib import Path
from db import DB_PATH, connect, init_db


def seed():
    init_db()
    data = json.loads((Path(__file__).parent / 'data' / 'demo_catalog.json').read_text())
    conn = connect()
    try:
        with conn:
            for i, c in enumerate(data['CATEGORIES']):
                conn.execute('''INSERT INTO categories
                    (id,icon,glyph,label_ru,label_uz,label_en,hint_ru,hint_uz,hint_en,position)
                    VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                    icon=excluded.icon,glyph=excluded.glyph,label_ru=excluded.label_ru,
                    label_uz=excluded.label_uz,label_en=excluded.label_en,hint_ru=excluded.hint_ru,
                    hint_uz=excluded.hint_uz,hint_en=excluded.hint_en,position=excluded.position''',
                    (c['id'],c['icon'],c.get('glyph',''),*[c['label'][k] for k in ('ru','uz','en')],
                     *[c['hint'][k] for k in ('ru','uz','en')],i))
            for p in data['PLATFORMS']:
                conn.execute('''INSERT INTO platforms (id,name,color,site_url) VALUES (?,?,?,?)
                    ON CONFLICT(id) DO NOTHING''',(p['id'],p['name'],p['color'],p.get('url','')))
            for r in data['REGIONS']:
                conn.execute('''INSERT INTO regions (id,name_ru,name_uz,name_en,delivery_bonus)
                    VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING''',
                    (r['id'],*[r['name'][k] for k in ('ru','uz','en')],r.get('offset',0)))
            for p in data['PRODUCTS']:
                conn.execute('''INSERT INTO products
                    (id,category_id,brand,title_ru,title_uz,title_en,rating,reviews,sold,image)
                    VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                    category_id=excluded.category_id,brand=excluded.brand,title_ru=excluded.title_ru,
                    title_uz=excluded.title_uz,title_en=excluded.title_en,image=excluded.image''',
                    (p['id'],p['cat'],p['brand'],*[p['title'][k] for k in ('ru','uz','en')],
                     p['rating'],p['reviews'],p['sold'],p['image']))
                for pos,path in enumerate(p.get('thumbs',[])):
                    conn.execute('''INSERT INTO product_images (product_id,path,position)
                        SELECT ?,?,? WHERE NOT EXISTS
                        (SELECT 1 FROM product_images WHERE product_id=? AND path=?)''',
                        (p['id'],path,pos,p['id'],path))
                for o in p['offers']:
                    conn.execute('''INSERT INTO offers (product_id,platform_id,price,in_stock,delivery,url)
                        SELECT ?,?,?,?,?,? WHERE NOT EXISTS
                        (SELECT 1 FROM offers WHERE product_id=? AND platform_id=?)''',
                        (p['id'],o['platform'],o['price'],int(o['inStock']),o['delivery'],o.get('url','#demo'),p['id'],o['platform']))
            for h in data['history']:
                for pt in h['points']:
                    conn.execute('''INSERT INTO price_history (product_id,period,price) VALUES (?,?,?)
                        ON CONFLICT(product_id,period) DO NOTHING''',(h['id'],pt['date'],pt['price']))
        print('Demo catalogue ready:', DB_PATH)
    finally:
        conn.close()


if __name__ == '__main__':
    seed()
