"""Local configuration; explicit environment variables always take precedence."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if os.environ.get("ARZONOL_LOAD_ENV", "1") == "1":
    for path in (ROOT / "backend/.env", ROOT / ".env"):
        if path.is_file():
            for line in path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip("\"'"))
            break

_db_path = Path(os.environ.get("ARZONOL_DB_PATH", "backend/arzonol.db"))
DB_PATH = _db_path if _db_path.is_absolute() else ROOT / _db_path
SESSION_COOKIE = "arzonol_session"
