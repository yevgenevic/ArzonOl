"""ArzonOL demo: same-origin API and an explicit public assets directory."""
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from config import ROOT
from db import get_db, init_db
import auth_routes, catalog_routes, profile_routes, admin_routes, ai_routes

FRONTEND = ROOT / "frontend"

@asynccontextmanager
async def lifespan(app):
    init_db()
    yield


app = FastAPI(title="ArzonOL Demo API", version="1.1.0", lifespan=lifespan,
              docs_url=None, redoc_url=None)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    # Cookie authentication is same-origin. Reject cross-origin writes, including login.
    origin = request.headers.get("origin")
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        if request.headers.get("sec-fetch-site") == "cross-site" or (
            origin and origin != str(request.base_url).rstrip("/")
        ):
            return JSONResponse({"detail": "Cross-origin request rejected"}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; "
        "connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    )
    response.headers["Cache-Control"] = "no-cache"
    if request.url.path.startswith("/api/") or request.url.path in ("/", "/admin"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/health")
def health(db=Depends(get_db)):
    db.execute("SELECT 1").fetchone()
    return {"ok": True, "demo": True}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return FileResponse(FRONTEND / "favicon.ico")


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")


@app.get("/admin")
def admin_page():
    # Сама страница отдаётся всем: данные она берёт из защищённого API
    return FileResponse(FRONTEND / "admin.html")



for module in (auth_routes, catalog_routes, profile_routes, admin_routes, ai_routes):
    app.include_router(module.router)

app.mount("/assets", StaticFiles(directory=FRONTEND / "assets"), name="assets")
