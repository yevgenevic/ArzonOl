"""Схема и доступ к SQLite.

Картинки товаров остаются файлами на диске, в базе лежит только путь.
144 JPEG в виде BLOB раздули бы базу и замедлили каждый запрос каталога,
не дав ничего взамен — отдавать файлы статикой быстрее и проще.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "arzonol.db"

SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    name          TEXT    NOT NULL DEFAULT '',
    region        TEXT    NOT NULL DEFAULT 'tashkent',
    lang          TEXT    NOT NULL DEFAULT 'ru',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT,
    is_admin      INTEGER NOT NULL DEFAULT 0
);

-- Непрозрачный токен вместо JWT: отзывается удалением строки и не требует
-- сторонних библиотек.
CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS categories (
    id       TEXT PRIMARY KEY,
    icon     TEXT NOT NULL,
    glyph    TEXT NOT NULL,
    label_ru TEXT NOT NULL, label_uz TEXT NOT NULL, label_en TEXT NOT NULL,
    hint_ru  TEXT NOT NULL, hint_uz  TEXT NOT NULL, hint_en  TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS platforms (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    color    TEXT NOT NULL,
    site_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS regions (
    id       TEXT PRIMARY KEY,
    name_ru  TEXT NOT NULL, name_uz TEXT NOT NULL, name_en TEXT NOT NULL,
    delivery_bonus INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    category_id TEXT    NOT NULL REFERENCES categories(id),
    brand       TEXT    NOT NULL,
    title_ru    TEXT    NOT NULL, title_uz TEXT NOT NULL, title_en TEXT NOT NULL,
    rating      REAL    NOT NULL DEFAULT 0,
    reviews     INTEGER NOT NULL DEFAULT 0,
    sold        INTEGER NOT NULL DEFAULT 0,
    image       TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);

-- Миниатюры отдельной таблицей: их число на товар может меняться
CREATE TABLE IF NOT EXISTS product_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    path       TEXT    NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

CREATE TABLE IF NOT EXISTS offers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    platform_id TEXT    NOT NULL REFERENCES platforms(id),
    price       INTEGER NOT NULL,
    in_stock    INTEGER NOT NULL DEFAULT 1,
    delivery    INTEGER NOT NULL DEFAULT 1,
    url         TEXT    NOT NULL DEFAULT '#',
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);

-- История минимальной цены по месяцам
CREATE TABLE IF NOT EXISTS price_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    period     TEXT    NOT NULL,
    price      INTEGER NOT NULL,
    UNIQUE(product_id, period)
);

-- Отслеживание цены: товар + желаемый порог. Самые ценные данные сервиса —
-- это заявленная готовность платить.
CREATE TABLE IF NOT EXISTS tracked_products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id   TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price INTEGER,
    contact      TEXT    NOT NULL DEFAULT '',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS compare_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
);

-- Пишется и для гостей: аналитика спроса не требует регистрации
CREATE TABLE IF NOT EXISTS search_queries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    query      TEXT    NOT NULL,
    results    INTEGER NOT NULL DEFAULT 0,
    lang       TEXT    NOT NULL DEFAULT 'ru',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_views (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# Колонки, добавленные после первого выпуска. CREATE TABLE IF NOT EXISTS их
# не создаст в уже существующей базе, поэтому догоняем через ALTER.
MIGRATIONS = [
    ("users", "is_admin", "INTEGER NOT NULL DEFAULT 0"),
]


def migrate(conn: sqlite3.Connection) -> None:
    for table, column, decl in MIGRATIONS:
        cols = {r["name"] for r in conn.execute(f"PRAGMA table_info({table})")}
        if column not in cols:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")


def init_db() -> None:
    conn = connect()
    with conn:
        conn.executescript(SCHEMA)
        migrate(conn)
    conn.close()
