"""ArzonOL — API агрегатора цен.

Один процесс отдаёт и API, и статику сайта: единый origin избавляет от CORS
и от необходимости держать два сервера.

Запуск:  uvicorn main:app --reload --port 8000   (из папки backend)
"""

from datetime import datetime
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

import ai
import auth
from db import connect, init_db

ROOT = Path(__file__).resolve().parent.parent

app = FastAPI(title="ArzonOL API", version="1.0.0")
init_db()
db = connect()


# --------------------------------------------------------------------------
# Схемы
# --------------------------------------------------------------------------

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(default="", max_length=80)
    region: str = "tashkent"
    lang: Literal["ru", "uz", "en"] = "ru"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileIn(BaseModel):
    name: str = Field(default="", max_length=80)
    region: str = "tashkent"
    lang: Literal["ru", "uz", "en"] = "ru"


class PasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class TrackIn(BaseModel):
    product_id: str
    target_price: int | None = None
    contact: str = ""


class SearchIn(BaseModel):
    query: str
    results: int = 0
    lang: str = "ru"


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=600)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    lang: Literal["ru", "uz", "en"] = "ru"
    product_id: str | None = None
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    region: str
    lang: str


# --------------------------------------------------------------------------
# Аутентификация
# --------------------------------------------------------------------------

def current_user(authorization: Annotated[str | None, Header()] = None):
    """Пользователь по токену. None, если токена нет или он протух."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization[7:]
    row = db.execute(
        """SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')""",
        (token,),
    ).fetchone()
    return row


def require_user(user=Depends(current_user)):
    if user is None:
        raise HTTPException(401, "Требуется вход")
    return user


def issue_session(user_id: int) -> str:
    token = auth.new_token()
    with db:
        db.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)",
            (token, user_id, auth.session_expiry()),
        )
        db.execute("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", (user_id,))
    return token


def user_dict(row) -> dict:
    return {"id": row["id"], "email": row["email"], "name": row["name"],
            "region": row["region"], "lang": row["lang"],
            "isAdmin": bool(row["is_admin"])}


def require_admin(user=Depends(require_user)):
    """Сводка по всем пользователям — не публичные данные."""
    if not user["is_admin"]:
        raise HTTPException(403, "Доступ только для администратора")
    return user


@app.post("/api/auth/register")
def register(body: RegisterIn):
    exists = db.execute("SELECT 1 FROM users WHERE email = ?", (body.email.lower(),)).fetchone()
    if exists:
        raise HTTPException(409, "Этот email уже зарегистрирован")

    with db:
        cur = db.execute(
            "INSERT INTO users (email, password_hash, name, region, lang) VALUES (?,?,?,?,?)",
            (body.email.lower(), auth.hash_password(body.password), body.name, body.region, body.lang),
        )
    user = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return {"token": issue_session(user["id"]), "user": user_dict(user)}


@app.post("/api/auth/login")
def login(body: LoginIn):
    user = db.execute("SELECT * FROM users WHERE email = ?", (body.email.lower(),)).fetchone()
    # Одинаковый ответ на неверный email и неверный пароль — не подсказываем,
    # какие адреса зарегистрированы
    if not user or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Неверный email или пароль")
    return {"token": issue_session(user["id"]), "user": user_dict(user)}


@app.post("/api/auth/logout")
def logout(authorization: Annotated[str | None, Header()] = None):
    if authorization and authorization.lower().startswith("bearer "):
        with db:
            db.execute("DELETE FROM sessions WHERE token = ?", (authorization[7:],))
    return {"ok": True}


@app.get("/api/auth/me")
def me(user=Depends(require_user)):
    return {"user": user_dict(user)}


# --------------------------------------------------------------------------
# Каталог
# --------------------------------------------------------------------------

def localized(row, field: str) -> dict:
    return {lang: row[f"{field}_{lang}"] for lang in ("ru", "uz", "en")}


@app.get("/api/catalog")
def catalog():
    """Справочники одним запросом — их немного, дробить незачем."""
    cats = [
        {"id": r["id"], "icon": r["icon"], "glyph": r["glyph"],
         "label": localized(r, "label"), "hint": localized(r, "hint")}
        for r in db.execute("SELECT * FROM categories ORDER BY position")
    ]
    platforms = [dict(r) for r in db.execute("SELECT * FROM platforms")]
    regions = [
        {"id": r["id"], "name": localized(r, "name"), "offset": r["delivery_bonus"]}
        for r in db.execute("SELECT * FROM regions")
    ]
    return {"categories": cats, "platforms": platforms, "regions": regions}


@app.get("/api/products")
def products(user=Depends(current_user)):
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
            "offers": offers.get(pid, []) if unlocked else [],
            "history": history.get(pid, []) if unlocked else [],
        })

    return {"unlocked": unlocked, "products": out}


# --------------------------------------------------------------------------
# Отслеживание цен и сравнение
# --------------------------------------------------------------------------

@app.get("/api/tracked")
def tracked_list(user=Depends(require_user)):
    rows = db.execute(
        "SELECT product_id, target_price, contact FROM tracked_products WHERE user_id = ?",
        (user["id"],),
    ).fetchall()
    return {"tracked": [dict(r) for r in rows]}


@app.post("/api/tracked")
def track(body: TrackIn, user=Depends(require_user)):
    with db:
        db.execute(
            """INSERT INTO tracked_products (user_id, product_id, target_price, contact)
               VALUES (?,?,?,?)
               ON CONFLICT(user_id, product_id)
               DO UPDATE SET target_price = excluded.target_price, contact = excluded.contact""",
            (user["id"], body.product_id, body.target_price, body.contact),
        )
    return {"ok": True}


@app.delete("/api/tracked/{product_id}")
def untrack(product_id: str, user=Depends(require_user)):
    with db:
        db.execute(
            "DELETE FROM tracked_products WHERE user_id = ? AND product_id = ?",
            (user["id"], product_id),
        )
    return {"ok": True}


@app.put("/api/profile")
def update_profile(body: ProfileIn, user=Depends(require_user)):
    with db:
        db.execute(
            "UPDATE users SET name = ?, region = ?, lang = ? WHERE id = ?",
            (body.name, body.region, body.lang, user["id"]),
        )
    row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    return {"user": user_dict(row)}


@app.post("/api/profile/password")
def change_password(body: PasswordIn, user=Depends(require_user),
                    authorization: Annotated[str | None, Header()] = None):
    if not auth.verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(400, "Текущий пароль неверен")

    token = authorization[7:] if authorization else ""
    with db:
        db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (auth.hash_password(body.new_password), user["id"]),
        )
        # Остальные сессии закрываем: смена пароля должна выкидывать чужие входы
        db.execute("DELETE FROM sessions WHERE user_id = ? AND token != ?", (user["id"], token))
    return {"ok": True}


@app.get("/api/profile/activity")
def profile_activity(user=Depends(require_user)):
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
             "image": "/" + r["image"], "at": r["seen"]}
            for r in viewed
        ],
        "since": user["created_at"],
    }


@app.get("/api/notifications")
def notifications(user=Depends(require_user)):
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


@app.get("/api/compare")
def compare_list(user=Depends(require_user)):
    rows = db.execute(
        "SELECT product_id FROM compare_items WHERE user_id = ?", (user["id"],)
    ).fetchall()
    return {"compare": [r["product_id"] for r in rows]}


@app.put("/api/compare")
def compare_replace(ids: list[str], user=Depends(require_user)):
    with db:
        db.execute("DELETE FROM compare_items WHERE user_id = ?", (user["id"],))
        for pid in ids[:4]:
            db.execute(
                "INSERT OR IGNORE INTO compare_items (user_id, product_id) VALUES (?,?)",
                (user["id"], pid),
            )
    return {"ok": True}


# --------------------------------------------------------------------------
# Аналитика: пишется и для гостей
# --------------------------------------------------------------------------

@app.post("/api/analytics/search")
def log_search(body: SearchIn, user=Depends(current_user)):
    q = body.query.strip()
    if not q:
        return {"ok": True}
    with db:
        db.execute(
            "INSERT INTO search_queries (user_id, query, results, lang) VALUES (?,?,?,?)",
            (user["id"] if user else None, q[:200], body.results, body.lang),
        )
    return {"ok": True}


@app.post("/api/analytics/view/{product_id}")
def log_view(product_id: str, user=Depends(current_user)):
    with db:
        db.execute(
            "INSERT INTO product_views (user_id, product_id) VALUES (?,?)",
            (user["id"] if user else None, product_id),
        )
    return {"ok": True}


@app.get("/api/stats")
def stats(user=Depends(require_admin)):
    """Сводка для демонстрации: что лежит в базе."""
    def one(sql: str, *a):
        return db.execute(sql, a).fetchone()[0]

    top = db.execute(
        """SELECT query, COUNT(*) n FROM search_queries
           GROUP BY lower(query) ORDER BY n DESC LIMIT 5"""
    ).fetchall()
    return {
        "users": one("SELECT COUNT(*) FROM users"),
        "products": one("SELECT COUNT(*) FROM products"),
        "offers": one("SELECT COUNT(*) FROM offers"),
        "tracked": one("SELECT COUNT(*) FROM tracked_products"),
        "searches": one("SELECT COUNT(*) FROM search_queries"),
        "views": one("SELECT COUNT(*) FROM product_views"),
        "topQueries": [{"query": r["query"], "count": r["n"]} for r in top],
    }


# --------------------------------------------------------------------------
# Статика сайта. Монтируется последней, чтобы не перехватывать /api
# --------------------------------------------------------------------------

@app.get("/api/stats/full")
def stats_full(user=Depends(require_admin)):
    """Развёрнутая сводка для страницы /stats."""
    def scalar(sql: str) -> int:
        return db.execute(sql).fetchone()[0]

    top_queries = db.execute(
        """SELECT query, COUNT(*) n FROM search_queries
            GROUP BY lower(query) ORDER BY n DESC, query LIMIT 8"""
    ).fetchall()

    top_viewed = db.execute(
        """SELECT p.id, p.title_ru AS title, COUNT(*) n
             FROM product_views v JOIN products p ON p.id = v.product_id
            GROUP BY p.id ORDER BY n DESC LIMIT 8"""
    ).fetchall()

    by_region = db.execute(
        """SELECT COALESCE(r.name_ru, u.region) AS region, COUNT(*) n
             FROM users u LEFT JOIN regions r ON r.id = u.region
            GROUP BY u.region ORDER BY n DESC"""
    ).fetchall()

    # Средняя цена, которую люди назвали как желаемую, против текущей минимальной.
    # Это и есть заявленная готовность платить — самые ценные данные сервиса.
    most_wanted = db.execute(
        """SELECT p.id, p.brand, p.title_ru AS title, p.image,
                  COUNT(*) AS watchers,
                  CAST(AVG(tp.target_price) AS INTEGER) AS avg_target,
                  (SELECT MIN(price) FROM offers o
                    WHERE o.product_id = p.id AND o.in_stock = 1) AS current_price
             FROM tracked_products tp JOIN products p ON p.id = tp.product_id
            WHERE tp.target_price IS NOT NULL
            GROUP BY p.id ORDER BY watchers DESC, avg_target DESC LIMIT 6"""
    ).fetchall()

    return {
        "users": scalar("SELECT COUNT(*) FROM users"),
        "offers": scalar("SELECT COUNT(*) FROM offers"),
        "tracked": scalar("SELECT COUNT(*) FROM tracked_products"),
        "withTarget": scalar("SELECT COUNT(*) FROM tracked_products WHERE target_price IS NOT NULL"),
        "searches": scalar("SELECT COUNT(*) FROM search_queries"),
        "views": scalar("SELECT COUNT(*) FROM product_views"),
        "topQueries": [{"query": r["query"], "count": r["n"]} for r in top_queries],
        "topViewed": [{"title": r["title"], "views": r["n"]} for r in top_viewed],
        "byRegion": [{"region": r["region"], "count": r["n"]} for r in by_region],
        "mostWanted": [
            {"title": r["title"], "brand": r["brand"], "image": "/" + r["image"],
             "watchers": r["watchers"], "avgTarget": r["avg_target"],
             "current": r["current_price"]}
            for r in most_wanted
        ],
    }


# --------------------------------------------------------------------------
# AI-консультант
# --------------------------------------------------------------------------

@app.get("/api/ai/status")
def ai_status():
    """Фронтенд узнаёт, включён ли AI, чтобы не показывать виджет впустую."""
    return {"enabled": ai.is_configured(), "model": ai.model_name()}


@app.post("/api/ai/chat")
def ai_chat(body: ChatIn, request: Request, user=Depends(current_user)):
    if not ai.is_configured():
        raise HTTPException(503, "AI not configured")

    client_ip = request.client.host if request.client else "unknown"
    if ai.rate_limited(client_ip):
        raise HTTPException(429, "Too many requests")

    # Цены гейтятся так же, как в /api/products: гостю модель их не назовёт
    context = ai.build_context(
        db, body.message, body.product_id, body.lang, unlocked=user is not None
    )
    messages = ai.build_messages(
        context, [turn.model_dump() for turn in body.history], body.message, body.lang
    )

    try:
        reply = ai.ask(messages)
    except RuntimeError as err:
        raise HTTPException(502, str(err)) from err

    reply = ai.clean_reply(reply)
    # Гейт цен держим кодом, а не доверием к модели
    if user is None:
        reply = ai.guest_safe(reply, db, body.lang)
    return {"reply": reply}


@app.get("/")
def index():
    return FileResponse(ROOT / "index.html")


@app.get("/admin")
def admin_page():
    # Сама страница отдаётся всем: данные она берёт из защищённого API
    return FileResponse(ROOT / "admin.html")


app.mount("/assets", StaticFiles(directory=ROOT / "assets"), name="assets")
