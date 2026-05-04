from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.api.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.system_user import ensure_default_admin_user, get_or_create_system_user


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
INDEX_FILE = TEMPLATES_DIR / "index.html"
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist"
FRONTEND_DIST_INDEX = FRONTEND_DIST_DIR / "index.html"
FRONTEND_DIST_ASSETS = FRONTEND_DIST_DIR / "assets"


def _operator_next_fallback_html() -> str:
    dev_url = settings.frontend_dev_server_url
    dev_hint = (
        f"<p>Для dev-режима можно указать <code>FRONTEND_DEV_SERVER_URL={dev_url}</code>.</p>"
        if dev_url
        else (
            "<p>React + Vite каркас подготовлен в каталоге <code>frontend/</code>, "
            "но frontend-сборка еще не запущена.</p>"
        )
    )
    return f"""
    <html>
      <body style="font-family: Segoe UI, Tahoma, sans-serif; padding: 32px; color: #1c2d24;">
        <h1>InfoCollect Operator Next</h1>
        <p>Новая desktop-панель на React + Vite еще не собрана.</p>
        {dev_hint}
        <p>После сборки страница будет доступна здесь же: <code>/operator-next</code>.</p>
      </body>
    </html>
    """


def _redirect_html(target_url: str, title: str) -> str:
    return (
        "<html><head>"
        f"<meta http-equiv='refresh' content='0; url={target_url}'>"
        f"<title>{title}</title>"
        "</head><body style='font-family: Segoe UI, Tahoma, sans-serif; padding: 32px; color: #1c2d24;'>"
        f"<p>Redirecting to <a href='{target_url}'>{target_url}</a>...</p>"
        "</body></html>"
    )


def create_app(*, bootstrap_builtin_users: bool = True) -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=settings.app_description,
    )

    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    if FRONTEND_DIST_ASSETS.exists():
        app.mount("/operator-next/assets", StaticFiles(directory=FRONTEND_DIST_ASSETS), name="operator-next-assets")

    app.include_router(api_router, prefix=settings.api_prefix)

    if bootstrap_builtin_users:

        @app.on_event("startup")
        def ensure_builtin_users() -> None:
            db: Session = SessionLocal()
            try:
                get_or_create_system_user(db)
                ensure_default_admin_user(db)
                db.commit()
            finally:
                db.close()

    @app.get("/", response_class=HTMLResponse, tags=["frontend"])
    def root() -> str:
        return _redirect_html("/operator-next", "InfoCollect Login")

    @app.get("/field", response_class=HTMLResponse, tags=["frontend"])
    def field() -> str:
        if INDEX_FILE.exists():
            return INDEX_FILE.read_text(encoding="utf-8")
        return "<html><body><h1>InfoCollect Field</h1><p>Field frontend is not available.</p></body></html>"

    @app.get("/operator", response_class=HTMLResponse, tags=["frontend"])
    def operator() -> str:
        return _redirect_html("/operator-next", "InfoCollect Operator")

    @app.get("/operator-next", response_class=HTMLResponse, tags=["frontend"])
    def operator_next() -> str:
        if settings.frontend_dev_server_url:
            return (
                "<html><head>"
                f"<meta http-equiv='refresh' content='0; url={settings.frontend_dev_server_url}'>"
                "</head><body>"
                f"<p>Redirecting to <a href='{settings.frontend_dev_server_url}'>{settings.frontend_dev_server_url}</a>...</p>"
                "</body></html>"
            )
        if FRONTEND_DIST_INDEX.exists():
            return FRONTEND_DIST_INDEX.read_text(encoding="utf-8")
        return _operator_next_fallback_html()

    return app
