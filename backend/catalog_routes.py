"""catalog routes for the demo application."""
from fastapi import APIRouter, Depends
from db import get_db
from dependencies import current_user

router = APIRouter()

def localized(row, field: str) -> dict:
    return {lang: row[f"{field}_{lang}"] for lang in ("ru", "uz", "en")}


@router.get("/api/catalog")
def catalog(db=Depends(get_db)):
    """Справочники одним запросом — их немного, дробить незачем."""
    cats = [
        {"id": r["id"], "icon": r["icon"], "glyph": r["glyph"],
         "label": localized(r, "label"), "hint": localized(r, "hint")}
        for r in db.execute("SELECT * FROM categories ORDER BY position")
    ]
    platforms = [dict(r) for r in db.execute("SELECT id, name, color, site_url FROM platforms")]
    regions = [
        {"id": r["id"], "name": localized(r, "name"), "offset": r["delivery_bonus"]}
        for r in db.execute("SELECT * FROM regions")
    ]
    return {"demo": True, "categories": cats, "platforms": platforms, "regions": regions}


@router.get("/api/products")
def products(user=Depends(current_user), db=Depends(get_db)):
    """Каталог целиком.

    Цены и история отдаются только авторизованным — это и есть тот самый гейт.
    Гостю остаётся offersCount, чтобы фронтенд знал, сколько строк размыть.
    Важно, что цены не уезжают в браузер вообще: размытие в CSS обходится
    инспектором, а отсутствие данных — нет.
    """
    rows = db.execute("SELECT * FROM products").fetchall()

    images: dict[str, list[str]] = {}
    for r in db.execute("SELECT product_id, path FROM product_images ORDER BY position"):
        images.setdefault(r["product_id"], []).append(r["path"])

    offers: dict[str, list[dict]] = {}
    for r in db.execute("SELECT * FROM offers ORDER BY price"):
        offers.setdefault(r["product_id"], []).append({
            "platform": r["platform_id"], "price": r["price"],
            "inStock": bool(r["in_stock"]), "delivery": r["delivery"], "url": r["url"],
        })

    history: dict[str, list[dict]] = {}
    for r in db.execute("SELECT product_id, period, price FROM price_history ORDER BY period"):
        history.setdefault(r["product_id"], []).append({"date": r["period"], "price": r["price"]})

    unlocked = user is not None
    out = []
    for row in rows:
        pid = row["id"]
        out.append({
            "id": pid, "cat": row["category_id"], "brand": row["brand"],
            "title": localized(row, "title"),
            "rating": row["rating"], "reviews": row["reviews"], "sold": row["sold"],
            "image": row["image"], "thumbs": images.get(pid, []),
            "offersCount": len(offers.get(pid, [])),
            "availability": [{"platform": o["platform"], "inStock": o["inStock"]} for o in offers.get(pid, [])],
            "offers": offers.get(pid, []) if unlocked else [],
            "history": history.get(pid, []) if unlocked else [],
        })

    return {"unlocked": unlocked, "products": out}
