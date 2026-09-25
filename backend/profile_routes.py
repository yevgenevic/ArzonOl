"""profile routes for the demo application."""
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from typing import Annotated
from db import get_db
import auth
from config import SESSION_COOKIE
from dependencies import check_auth_limit, current_user, ensure_product, ensure_region, limit_analytics, require_user, user_dict
from schemas import PasswordIn, ProfileIn, SearchIn, TrackIn

router = APIRouter()

@router.get("/api/tracked")
def tracked_list(user=Depends(require_user), db=Depends(get_db)):
    rows = db.execute(
        "SELECT product_id, target_price, contact FROM tracked_products WHERE user_id = ?",
        (user["id"],),
    ).fetchall()
    return {"tracked": [dict(r) for r in rows]}


@router.post("/api/tracked")
def track(body: TrackIn, user=Depends(require_user), db=Depends(get_db)):
    ensure_product(db, body.product_id)
    with db:
        db.execute(
            """INSERT INTO tracked_products (user_id, product_id, target_price, contact)
               VALUES (?,?,?,?)
               ON CONFLICT(user_id, product_id)
               DO UPDATE SET target_price = excluded.target_price, contact = excluded.contact""",
            (user["id"], body.product_id, body.target_price, body.contact),
        )
    return {"ok": True}


@router.delete("/api/tracked/{product_id}")
def untrack(product_id: str, user=Depends(require_user), db=Depends(get_db)):
    with db:
        db.execute(
            "DELETE FROM tracked_products WHERE user_id = ? AND product_id = ?",
            (user["id"], product_id),
        )
    return {"ok": True}


@router.put("/api/profile")
def update_profile(body: ProfileIn, user=Depends(require_user), db=Depends(get_db)):
    ensure_region(db, body.region)
    with db:
        db.execute(
            "UPDATE users SET name = ?, region = ?, lang = ? WHERE id = ?",
            (body.name, body.region, body.lang, user["id"]),
        )
    row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    return {"user": user_dict(row)}


@router.post("/api/profile/password")
def change_password(body: PasswordIn, request: Request, user=Depends(require_user), db=Depends(get_db)):
    check_auth_limit(request)
    if not auth.verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(400, "Текущий пароль неверен")

    token = request.cookies.get(SESSION_COOKIE, "")
    with db:
        db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (auth.hash_password(body.new_password), user["id"]),
        )
        # Остальные сессии закрываем: смена пароля должна выкидывать чужие входы
        db.execute("DELETE FROM sessions WHERE user_id = ? AND token != ?", (user["id"], token))
    return {"ok": True}


@router.get("/api/profile/activity")
def profile_activity(user=Depends(require_user), db=Depends(get_db)):
    """История действий пользователя для личного кабинета."""
    searches = db.execute(
        """SELECT query, created_at FROM search_queries
            WHERE user_id = ? ORDER BY created_at DESC LIMIT 10""",
        (user["id"],),
    ).fetchall()

    viewed = db.execute(
        """SELECT p.id, p.brand, p.title_ru AS title, p.image, MAX(v.created_at) AS seen
             FROM product_views v JOIN products p ON p.id = v.product_id
            WHERE v.user_id = ?
            GROUP BY p.id ORDER BY seen DESC LIMIT 8""",
        (user["id"],),
    ).fetchall()

    return {
        "searches": [{"query": r["query"], "at": r["created_at"]} for r in searches],
        "viewed": [
            {"id": r["id"], "brand": r["brand"], "title": r["title"],
             "image": "/" + r["image"].lstrip("/"), "at": r["seen"]}
            for r in viewed
        ],
        "since": user["created_at"],
    }


@router.get("/api/notifications")
def notifications(user=Depends(require_user), db=Depends(get_db)):
    """Отслеживания, где цена уже достигла заявленной цели.

    Это и есть замкнутый цикл сервиса: человек назвал цену, мы следим,
    при достижении показываем. Сравнение идёт с минимальной ценой в наличии —
    предложение, которого нет на складе, целью считать нельзя.
    """
    rows = db.execute(
        """SELECT tp.product_id, tp.target_price,
                  (SELECT MIN(price) FROM offers o
                    WHERE o.product_id = tp.product_id AND o.in_stock = 1) AS current_price
             FROM tracked_products tp
            WHERE tp.user_id = ? AND tp.target_price IS NOT NULL""",
        (user["id"],),
    ).fetchall()

    hits = [
        {"product_id": r["product_id"], "target": r["target_price"], "current": r["current_price"]}
        for r in rows
        if r["current_price"] is not None and r["current_price"] <= r["target_price"]
    ]
    return {"notifications": hits}


@router.get("/api/compare")
def compare_list(user=Depends(require_user), db=Depends(get_db)):
    rows = db.execute(
        "SELECT product_id FROM compare_items WHERE user_id = ?", (user["id"],)
    ).fetchall()
    return {"compare": [r["product_id"] for r in rows]}


@router.put("/api/compare")
def compare_replace(ids: Annotated[list[str], Body(max_length=4)], user=Depends(require_user), db=Depends(get_db)):
    for pid in ids:
        ensure_product(db, pid)
    with db:
        db.execute("DELETE FROM compare_items WHERE user_id = ?", (user["id"],))
        for pid in ids[:4]:
            db.execute(
                "INSERT OR IGNORE INTO compare_items (user_id, product_id) VALUES (?,?)",
                (user["id"], pid),
            )
    return {"ok": True}


@router.post("/api/analytics/search")
def log_search(body: SearchIn, request: Request, user=Depends(current_user), db=Depends(get_db)):
    limit_analytics(request)
    q = body.query.strip()
    if not q:
        return {"ok": True}
    with db:
        db.execute(
            "INSERT INTO search_queries (user_id, query, results, lang) VALUES (?,?,?,?)",
            (user["id"] if user else None, q[:200], body.results, body.lang),
        )
    return {"ok": True}


@router.post("/api/analytics/view/{product_id}")
def log_view(product_id: str, request: Request, user=Depends(current_user), db=Depends(get_db)):
    ensure_product(db, product_id)
    limit_analytics(request)
    with db:
        db.execute(
            "INSERT INTO product_views (user_id, product_id) VALUES (?,?)",
            (user["id"] if user else None, product_id),
        )
    return {"ok": True}
