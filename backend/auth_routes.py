"""auth routes for the demo application."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from db import get_db
import sqlite3
import auth
from config import SESSION_COOKIE
from dependencies import check_auth_limit, ensure_region, require_user, set_session, user_dict
from schemas import LoginIn, RegisterIn

router = APIRouter()

@router.post("/api/auth/register")
def register(body: RegisterIn, request: Request, response: Response, db=Depends(get_db)):
    check_auth_limit(request)
    ensure_region(db, body.region)
    exists = db.execute("SELECT 1 FROM users WHERE email = ?", (body.email.lower(),)).fetchone()
    if exists:
        raise HTTPException(409, "Этот email уже зарегистрирован")

    try:
        with db:
            cur = db.execute(
                "INSERT INTO users (email, password_hash, name, region, lang) VALUES (?,?,?,?,?)",
                (body.email.lower(), auth.hash_password(body.password), body.name, body.region, body.lang),
            )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(409, "Этот email уже зарегистрирован") from exc
    user = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    set_session(response, request, db, user["id"])
    return {"user": user_dict(user)}


@router.post("/api/auth/login")
def login(body: LoginIn, request: Request, response: Response, db=Depends(get_db)):
    check_auth_limit(request)
    user = db.execute("SELECT * FROM users WHERE email = ?", (body.email.lower(),)).fetchone()
    # Одинаковый ответ на неверный email и неверный пароль — не подсказываем,
    # какие адреса зарегистрированы
    if not user or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Неверный email или пароль")
    set_session(response, request, db, user["id"])
    return {"user": user_dict(user)}


@router.post("/api/auth/logout")
def logout(request: Request, response: Response, db=Depends(get_db)):
    with db:
        db.execute("DELETE FROM sessions WHERE token = ?", (request.cookies.get(SESSION_COOKIE, ""),))
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/api/auth/me")
def me(user=Depends(require_user)):
    return {"user": user_dict(user)}
