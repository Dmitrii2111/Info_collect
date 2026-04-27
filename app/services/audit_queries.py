from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.org import Device, User
from app.models.sync import DomainEvent


def _actor_scope(login: str | None, role: UserRole | None) -> str:
    if login == "system" or role is None:
        return "system"
    if role == UserRole.OPERATOR:
        return "field"
    return "office"


def get_audit_summary(session: Session) -> dict:
    rows = session.execute(
        select(User.login, User.role, func.count(DomainEvent.id))
        .select_from(DomainEvent)
        .outerjoin(User, User.id == DomainEvent.user_id)
        .group_by(User.login, User.role)
    ).all()

    summary = {
        "total": 0,
        "system_events": 0,
        "field_events": 0,
        "office_events": 0,
    }
    for login, role, count in rows:
        scope = _actor_scope(login, role)
        summary["total"] += int(count or 0)
        if scope == "system":
            summary["system_events"] += int(count or 0)
        elif scope == "field":
            summary["field_events"] += int(count or 0)
        else:
            summary["office_events"] += int(count or 0)
    return summary


def list_audit_events(
    session: Session,
    *,
    actor_scope: str | None = None,
    event_type: str | None = None,
    aggregate_type: str | None = None,
    limit: int = 100,
) -> list[dict]:
    query = (
        select(
            DomainEvent.id,
            DomainEvent.event_type,
            DomainEvent.aggregate_type,
            DomainEvent.aggregate_id,
            DomainEvent.user_id,
            User.full_name,
            User.login,
            User.role,
            Device.device_uid,
            Device.platform,
            DomainEvent.occurred_at_device,
            DomainEvent.recorded_at_server,
            DomainEvent.payload_json,
            DomainEvent.metadata_json,
        )
        .select_from(DomainEvent)
        .outerjoin(User, User.id == DomainEvent.user_id)
        .outerjoin(Device, Device.id == DomainEvent.device_id)
        .order_by(DomainEvent.recorded_at_server.desc())
        .limit(max(1, min(limit, 500)))
    )

    if event_type:
        query = query.where(DomainEvent.event_type == event_type)
    if aggregate_type:
        query = query.where(DomainEvent.aggregate_type == aggregate_type)
    if actor_scope == "system":
        query = query.where((User.login == "system") | (User.id.is_(None)))
    elif actor_scope == "field":
        query = query.where(User.role == UserRole.OPERATOR)
    elif actor_scope == "office":
        query = query.where(User.role.in_([UserRole.DISPATCHER, UserRole.ADMIN]), User.login != "system")

    rows = session.execute(query).all()
    items: list[dict] = []
    for row in rows:
        scope = _actor_scope(row.login, row.role)
        items.append(
            {
                "event_id": str(row.id),
                "event_type": row.event_type,
                "aggregate_type": row.aggregate_type,
                "aggregate_id": str(row.aggregate_id),
                "user_id": str(row.user_id) if row.user_id else None,
                "user_name": row.full_name or row.login,
                "user_role": row.role.value if row.role else None,
                "actor_scope": scope,
                "device_uid": row.device_uid,
                "platform": row.platform,
                "occurred_at_device": row.occurred_at_device,
                "recorded_at_server": row.recorded_at_server,
                "payload_json": row.payload_json or {},
                "metadata_json": row.metadata_json or {},
            }
        )
    return items
