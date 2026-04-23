from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.org import User


def get_or_create_system_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.login == "system"))
    if user is None:
        user = User(
            login="system",
            password_hash="disabled",
            last_name="System",
            first_name="Import",
            middle_name=None,
            full_name="System Import",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(user)
        db.flush()
    return user


def ensure_default_admin_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.login == "admin"))
    if user is None:
        user = User(
            login="admin",
            password_hash="Admin123!",
            last_name="Админ",
            first_name="Системы",
            middle_name=None,
            full_name="Админ Системы",
            role=UserRole.ADMIN,
            is_active=True,
            phone="+79990000000",
            email="admin@infocollect.local",
        )
        db.add(user)
        db.flush()
        return user

    changed = False
    if not user.is_active:
        user.is_active = True
        changed = True
    if user.role != UserRole.ADMIN:
        user.role = UserRole.ADMIN
        changed = True
    if user.password_hash != "Admin123!":
        user.password_hash = "Admin123!"
        changed = True
    if changed:
        db.flush()
    return user
