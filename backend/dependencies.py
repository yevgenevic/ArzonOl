"""Request-scoped database, sessions and access checks."""
from fastapi import Depends, HTTPException, Request
from db import get_db
from config import SESSION_COOKIE
from security import auth_limiter, analytics_limiter
import auth

def current_user(request: Request, db=Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    return db.execute(
        """SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')""", (token,),
    ).fetchone()


def set_session(response, request, db, user_id):
    token = issue_session(db, user_id)
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="strict",
                        secure=request.url.scheme == "https", max_age=auth.SESSION_DAYS * 86400, path="/")


def check_auth_limit(request):
    if auth_limiter.limited(request.client.host if request.client else "unknown"):
        raise HTTPException(429, "Слишком много попыток входа. Повторите позже.")


def ensure_product(db, product_id):
    if not db.execute("SELECT 1 FROM products WHERE id = ?", (product_id,)).fetchone():
        raise HTTPException(404, "Товар не найден")


def ensure_region(db, region):
    if not db.execute("SELECT 1 FROM regions WHERE id = ?", (region,)).fetchone():
        raise HTTPException(422, "Неизвестный регион")


def require_user(user=Depends(current_user)):
    if user is None:
        raise HTTPException(401, "Требуется вход")
    return user


def issue_session(db, user_id: int) -> str:
    token = auth.new_token()
    with db:
        db.execute("DELETE FROM sessions WHERE expires_at <= datetime('now')")
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


def limit_analytics(request):
    if analytics_limiter.limited(request.client.host if request.client else "unknown"):
        raise HTTPException(429, "Too many analytics events")
