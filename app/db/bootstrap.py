from __future__ import annotations

from sqlalchemy import text

from app.db.session import engine


def test_connection() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
