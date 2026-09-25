"""admin routes for the demo application."""
from fastapi import APIRouter, Depends, HTTPException
from db import get_db
from dependencies import require_admin
from schemas import CreatePlatformIn, SaveIntegrationIn, TestIntegrationIn

router = APIRouter()

@router.get("/api/stats")
def stats(user=Depends(require_admin), db=Depends(get_db)):
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


@router.get("/api/stats/full")
def stats_full(user=Depends(require_admin), db=Depends(get_db)):
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
            {"title": r["title"], "brand": r["brand"], "image": "/" + r["image"].lstrip("/"),
             "watchers": r["watchers"], "avgTarget": r["avg_target"],
             "current": r["current_price"]}
            for r in most_wanted
        ],
    }


@router.get("/api/admin/integrations")
def admin_integrations(user=Depends(require_admin), db=Depends(get_db)):
    """Список всех подключенных маркетплейсов, статусы и параметры интеграции."""
    platforms = db.execute(
        """SELECT p.*,
                  (SELECT COUNT(*) FROM offers o WHERE o.platform_id = p.id) AS offers_count,
                  (SELECT COUNT(*) FROM offers o WHERE o.platform_id = p.id AND o.in_stock = 1) AS in_stock_count
             FROM platforms p ORDER BY offers_count DESC"""
    ).fetchall()

    recent_logs = db.execute(
        """SELECT sl.*, p.name AS platform_name, p.color AS platform_color
             FROM sync_logs sl JOIN platforms p ON p.id = sl.platform_id
            ORDER BY sl.created_at DESC LIMIT 15"""
    ).fetchall()

    return {
        "platforms": [
            {
                "id": r["id"],
                "name": r["name"],
                "color": r["color"],
                "site_url": r["site_url"] or "",
                "has_api_key": bool(r["api_key"]),
                "feed_url": r["feed_url"] or "",
                "integration_type": r["integration_type"] or "api",
                "sync_interval": r["sync_interval"] or 60,
                "last_sync_at": r["last_sync_at"],
                "status": r["status"] or "active",
                "offers_count": r["offers_count"],
                "in_stock_count": r["in_stock_count"],
            }
            for r in platforms
        ],
        "logs": [
            {
                "id": r["id"],
                "platform_id": r["platform_id"],
                "platform_name": r["platform_name"],
                "platform_color": r["platform_color"],
                "status": r["status"],
                "items_updated": r["items_updated"],
                "message": r["message"],
                "created_at": r["created_at"],
            }
            for r in recent_logs
        ],
        "summary": {
            "total_platforms": len(platforms),
            "active_platforms": sum(1 for r in platforms if (r["status"] or "active") == "active"),
            "total_offers": sum(r["offers_count"] for r in platforms),
            "last_sync": max((r["last_sync_at"] for r in platforms if r["last_sync_at"]), default=None),
        }
    }


@router.post("/api/admin/integrations/save")
def admin_save_integration(body: SaveIntegrationIn, user=Depends(require_admin), db=Depends(get_db)):
    """Сохранение ключей и параметров интеграции маркетплейса."""
    p = db.execute("SELECT id FROM platforms WHERE id = ?", (body.platform_id,)).fetchone()
    if not p:
        raise HTTPException(404, "Маркетплейс не найден")

    with db:
        db.execute(
            """UPDATE platforms
                  SET api_key = CASE WHEN ? = '' THEN api_key ELSE ? END, feed_url = ?, integration_type = ?,
                      sync_interval = ?, status = ?
                WHERE id = ?""",
            (body.api_key.strip(), body.api_key.strip(), body.feed_url.strip(), body.integration_type,
             body.sync_interval, body.status, body.platform_id)
        )
    return {"ok": True, "message": "Параметры интеграции сохранены"}


@router.post("/api/admin/integrations/test")
def admin_test_integration(body: TestIntegrationIn, user=Depends(require_admin), db=Depends(get_db)):
    """Тестовая проверка связи с API или Feed маркетплейса."""
    if not db.execute("SELECT 1 FROM platforms WHERE id = ?", (body.platform_id,)).fetchone():
        raise HTTPException(404, "Маркетплейс не найден")
    return {"success": True, "demo": True, "status": "demo", "latency_ms": None,
            "message": "Демо: формат настроек проверен. Запрос к магазину не выполнялся."}


@router.post("/api/admin/integrations/sync/{platform_id}")
def admin_sync_platform(platform_id: str, user=Depends(require_admin), db=Depends(get_db)):
    """Ручной запуск синхронизации цен для одного маркетплейса."""
    p = db.execute("SELECT * FROM platforms WHERE id = ?", (platform_id,)).fetchone()
    if not p:
        raise HTTPException(404, "Маркетплейс не найден")

    if p["status"] == "paused":
        raise HTTPException(409, "Площадка приостановлена")
    with db:
        db.execute("INSERT INTO sync_logs (platform_id, status, items_updated, message) VALUES (?, 'demo', 0, ?)",
                   (platform_id, "Демо-запуск: цены не обновлялись, внешний запрос не выполнялся"))
    return {"ok": True, "demo": True, "platform_id": platform_id, "items_updated": 0,
            "message": "Демо-запуск завершён. Цены и даты проверки не изменены."}


@router.post("/api/admin/integrations/sync-all")
def admin_sync_all(user=Depends(require_admin), db=Depends(get_db)):
    """Синхронизация всех активных маркетплейсов."""
    platforms = db.execute("SELECT id FROM platforms WHERE status != 'paused'").fetchall()
    with db:
        for p in platforms:
            db.execute("INSERT INTO sync_logs (platform_id, status, items_updated, message) VALUES (?, 'demo', 0, ?)",
                       (p["id"], "Демо-запуск: цены не обновлялись, внешний запрос не выполнялся"))
    return {"ok": True, "demo": True, "platforms_count": len(platforms), "total_items_updated": 0,
            "message": "Демо-запуск завершён. Внешние магазины не подключены."}


@router.post("/api/admin/platforms/create")
def admin_create_platform(body: CreatePlatformIn, user=Depends(require_admin), db=Depends(get_db)):
    """Добавление нового маркетплейса/магазина в агрегатор."""
    pid = body.id.strip().lower()
    exists = db.execute("SELECT id FROM platforms WHERE id = ?", (pid,)).fetchone()
    if exists:
        raise HTTPException(400, "Маркетплейс с таким ID уже существует")

    with db:
        db.execute(
            """INSERT INTO platforms (id, name, color, site_url, api_key, feed_url, integration_type, status, last_sync_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NULL)""",
            (pid, body.name.strip(), body.color.strip(), body.site_url.strip(),
             body.api_key.strip(), body.feed_url.strip(), body.integration_type)
        )
        db.execute(
            """INSERT INTO sync_logs (platform_id, status, items_updated, message, created_at)
               VALUES (?, 'success', 0, 'Маркетплейс добавлен в систему', datetime('now'))""",
            (pid,)
        )

    return {"ok": True, "message": f"Маркетплейс «{body.name}» успешно добавлен"}
