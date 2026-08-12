"""Наполнение базы каталогом.

Данные берутся из assets/js/data.js через Node, а не переписываются руками:
иначе фронтенд и база разъедутся при первой же правке каталога.
Скрипт идемпотентный — можно запускать повторно.
"""

import json
import subprocess
import sys
from pathlib import Path

from db import DB_PATH, connect, init_db

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "assets" / "js" / "data.js"

EXTRACT = """
const fs = require('fs');
const src = fs.readFileSync(process.argv[1], 'utf8');
const res = eval(src + `; ({
  CATEGORIES, PLATFORMS, REGIONS, PRODUCTS, PARTNERS,
  history: PRODUCTS.map(p => ({ id: p.id, points: priceHistory(p) }))
})`);
process.stdout.write(JSON.stringify(res));
"""


def load_from_js() -> dict:
    proc = subprocess.run(
        ["node", "-e", EXTRACT, str(DATA_JS)],
        capture_output=True, text=True, encoding="utf-8",
    )
    if proc.returncode != 0:
        sys.exit(f"Не удалось прочитать data.js:\n{proc.stderr}")
    return json.loads(proc.stdout)


def seed() -> None:
    init_db()
    data = load_from_js()
    conn = connect()

    with conn:
        # Каталог перезаливается целиком; пользователи и их данные не трогаются
        conn.execute("DELETE FROM price_history")
        conn.execute("DELETE FROM offers")
        conn.execute("DELETE FROM product_images")
        conn.execute("DELETE FROM products")
        conn.execute("DELETE FROM categories")
        conn.execute("DELETE FROM platforms")
        conn.execute("DELETE FROM regions")

        for i, c in enumerate(data["CATEGORIES"]):
            conn.execute(
                """INSERT INTO categories
                   (id, icon, glyph, label_ru, label_uz, label_en, hint_ru, hint_uz, hint_en, position)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (c["id"], c["icon"], c.get("glyph", ""),
                 c["label"]["ru"], c["label"]["uz"], c["label"]["en"],
                 c["hint"]["ru"], c["hint"]["uz"], c["hint"]["en"], i),
            )

        for p in data["PLATFORMS"]:
            conn.execute(
                "INSERT INTO platforms (id, name, color, site_url) VALUES (?,?,?,?)",
                (p["id"], p["name"], p["color"], p.get("url", "")),
            )

        for r in data["REGIONS"]:
            conn.execute(
                "INSERT INTO regions (id, name_ru, name_uz, name_en, delivery_bonus) VALUES (?,?,?,?,?)",
                (r["id"], r["name"]["ru"], r["name"]["uz"], r["name"]["en"], r.get("offset", 0)),
            )

        for p in data["PRODUCTS"]:
            conn.execute(
                """INSERT INTO products
                   (id, category_id, brand, title_ru, title_uz, title_en, rating, reviews, sold, image)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (p["id"], p["cat"], p["brand"],
                 p["title"]["ru"], p["title"]["uz"], p["title"]["en"],
                 p["rating"], p["reviews"], p["sold"], p["image"]),
            )

            for pos, path in enumerate(p.get("thumbs", [])):
                conn.execute(
                    "INSERT INTO product_images (product_id, path, position) VALUES (?,?,?)",
                    (p["id"], path, pos),
                )

            for o in p["offers"]:
                conn.execute(
                    """INSERT INTO offers (product_id, platform_id, price, in_stock, delivery, url)
                       VALUES (?,?,?,?,?,?)""",
                    (p["id"], o["platform"], o["price"], 1 if o["inStock"] else 0,
                     o["delivery"], o.get("url", "#")),
                )

        for h in data["history"]:
            for pt in h["points"]:
                conn.execute(
                    "INSERT INTO price_history (product_id, period, price) VALUES (?,?,?)",
                    (h["id"], pt["date"], pt["price"]),
                )

    counts = {
        t: conn.execute(f"SELECT COUNT(*) c FROM {t}").fetchone()["c"]
        for t in ("categories", "platforms", "regions", "products",
                  "product_images", "offers", "price_history", "users")
    }
    conn.close()

    # Вывод латиницей: консоль Windows здесь в cp1254 и падает на кириллице
    print("db:", DB_PATH)
    for t, n in counts.items():
        print(f"  {t:<15} {n}")


if __name__ == "__main__":
    seed()
