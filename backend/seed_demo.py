"""Демонстрационные данные: пользователи, отслеживания, поисковые запросы.

Отдельно от seed.py: тот заливает каталог, этот — жизнь вокруг него.
Запускается только на пустой таблице пользователей; существующие данные сохраняет.

Показательный аккаунт для демонстрации:  demo@arzonol.uz / demo1234
"""

import random
from datetime import datetime, timedelta

import auth
from db import connect, init_db

DEMO_PASSWORD = "demo1234"

USERS = [
    ("demo@arzonol.uz",      "Демо Аккаунт",     "tashkent",  "ru"),
    ("aziza.k@mail.uz",      "Азиза Каримова",   "tashkent",  "ru"),
    ("jasur.t@gmail.com",    "Jasur To'rayev",   "samarkand", "uz"),
    ("nodira.s@mail.ru",     "Нодира Салимова",  "bukhara",   "ru"),
    ("bekzod.r@inbox.uz",    "Bekzod Rahimov",   "fergana",   "uz"),
    ("dilnoza@umail.uz",     "Дилноза Юсупова",  "tashkent",  "ru"),
    ("sardor.m@gmail.com",   "Sardor Mirzayev",  "namangan",  "uz"),
    ("kamola.a@mail.uz",     "Камола Абдуллаева", "andijan",  "ru"),
    ("otabek@yandex.ru",     "Otabek Nazarov",   "tashkent",  "uz"),
    ("malika.h@mail.uz",     "Малика Хасанова",  "samarkand", "ru"),
    ("timur.v@gmail.com",    "Тимур Валиев",     "tashkent",  "ru"),
    ("shahnoza@inbox.uz",    "Shahnoza Qodirova", "bukhara",  "uz"),
]

# Что реально ищут: частотность неравномерная, как в жизни
QUERIES = [
    ("кондиционер", 14), ("холодильник", 11), ("диван", 9), ("ламинат", 8),
    ("стиральная машина", 7), ("цемент", 6), ("телевизор", 6), ("керамогранит", 5),
    ("матрас", 5), ("шкаф", 4), ("краска", 4), ("плитка", 4),
    ("духовой шкаф", 3), ("кухонный гарнитур", 3), ("гипсокартон", 3),
    ("muzlatkich", 3), ("divan", 2), ("konditsioner", 2), ("kir yuvish", 2),
    ("посудомоечная машина", 2), ("обои", 2), ("смеситель", 2), ("кирпич", 2),
    ("робот пылесос", 2), ("утеплитель", 1), ("кофемашина", 1),
    ("refrigerator", 1), ("sofa", 1), ("стол обеденный", 1), ("кресло", 1),
]

# Товары, которые чаще всего ставят на отслеживание
POPULAR = ["t01", "t03", "t02", "t04", "f01", "f10", "q01", "t09", "f03", "q02", "t11", "f04"]


def rand_past(days_max: int) -> str:
    d = datetime.now() - timedelta(days=random.randint(0, days_max),
                                   hours=random.randint(0, 23),
                                   minutes=random.randint(0, 59))
    return d.strftime("%Y-%m-%d %H:%M:%S")


def best_price(conn, product_id: int) -> int | None:
    row = conn.execute(
        "SELECT MIN(price) p FROM offers WHERE product_id = ? AND in_stock = 1",
        (product_id,),
    ).fetchone()
    return row["p"] if row else None


def seed_demo() -> None:
    random.seed(2026)          # воспроизводимо: одинаковые данные при каждом запуске
    init_db()
    conn = connect()

    if not conn.execute("SELECT COUNT(*) c FROM products").fetchone()["c"]:
        raise SystemExit("Сначала заполните каталог: python seed.py")

    if conn.execute("SELECT 1 FROM users LIMIT 1").fetchone():
        conn.close()
        print("Users already exist; demo users were not recreated.")
        return

    with conn:
        pwd = auth.hash_password(DEMO_PASSWORD)
        ids = []
        for i, (email, name, region, lang) in enumerate(USERS):
            cur = conn.execute(
                """INSERT INTO users (email, password_hash, name, region, lang, created_at, last_login_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (email, pwd, name, region, lang, rand_past(60), rand_past(7)),
            )
            ids.append(cur.lastrowid)

        # Первый аккаунт — администратор: только он видит /admin
        conn.execute("UPDATE users SET is_admin = 1 WHERE id = ?", (ids[0],))

        products = [r["id"] for r in conn.execute("SELECT id FROM products")]

        # Отслеживания: показательный аккаунт получает больше всех
        for uid in ids:
            n = 6 if uid == ids[0] else random.randint(1, 4)
            for pid in random.sample(POPULAR + random.sample(products, 6), n):
                bp = best_price(conn, pid)
                if bp is None:
                    continue
                # Цель ниже текущей на 5–20%: человек ждёт скидку.
                # У части записей цели нет — просто следят.
                target = int(bp * random.uniform(0.80, 0.95) / 1000) * 1000 \
                    if random.random() < 0.75 else None
                conn.execute(
                    """INSERT OR IGNORE INTO tracked_products
                       (user_id, product_id, target_price, contact, created_at)
                       VALUES (?,?,?,?,?)""",
                    (uid, pid, target, "", rand_past(45)),
                )

        for uid in random.sample(ids, 6):
            for pid in random.sample(products, random.randint(2, 4)):
                conn.execute(
                    "INSERT OR IGNORE INTO compare_items (user_id, product_id, created_at) VALUES (?,?,?)",
                    (uid, pid, rand_past(20)),
                )

        # Часть запросов от гостей (user_id = NULL) — так и в жизни
        for query, times in QUERIES:
            for _ in range(times):
                uid = random.choice(ids) if random.random() < 0.45 else None
                lang = "uz" if any(c in query for c in "qxo'") and " " not in query else "ru"
                conn.execute(
                    "INSERT INTO search_queries (user_id, query, results, lang, created_at) VALUES (?,?,?,?,?)",
                    (uid, query, random.randint(0, 12), lang, rand_past(30)),
                )

        for _ in range(240):
            uid = random.choice(ids) if random.random() < 0.4 else None
            pid = random.choice(POPULAR if random.random() < 0.6 else products)
            conn.execute(
                "INSERT INTO product_views (user_id, product_id, created_at) VALUES (?,?,?)",
                (uid, pid, rand_past(30)),
            )

    counts = {t: conn.execute(f"SELECT COUNT(*) c FROM {t}").fetchone()["c"]
              for t in ("users", "tracked_products", "compare_items",
                        "search_queries", "product_views")}
    with_target = conn.execute(
        "SELECT COUNT(*) c FROM tracked_products WHERE target_price IS NOT NULL").fetchone()["c"]
    conn.close()

    print("demo data seeded")
    for t, n in counts.items():
        print(f"  {t:<18} {n}")
    print(f"  {'with target price':<18} {with_target}")
    print(f"\n  login: demo@arzonol.uz / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed_demo()
