"""Пароли и сессии.

scrypt берётся из стандартной библиотеки — bcrypt/argon2 потребовали бы
внешнюю зависимость и компилятор, а стойкости scrypt здесь достаточно.
Токен сессии непрозрачный и лежит в таблице: отзывается удалением строки.
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

SESSION_DAYS = 30

# Параметры scrypt: n=2**14 держит проверку около 50 мс на обычной машине
_N, _R, _P, _DKLEN = 2 ** 14, 8, 1, 32


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, dklen=_DKLEN)
    return f"scrypt${_N}${_R}${_P}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, n, r, p, salt_hex, dk_hex = stored.split("$")
        if algo != "scrypt":
            return False
        dk = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex),
            n=int(n), r=int(r), p=int(p), dklen=len(bytes.fromhex(dk_hex)),
        )
        # сравнение постоянного времени, чтобы не утекала информация по таймингу
        return hmac.compare_digest(dk.hex(), dk_hex)
    except (ValueError, TypeError):
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)


def session_expiry() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).strftime("%Y-%m-%d %H:%M:%S")
