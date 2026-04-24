from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AuditSummaryResponse(BaseModel):
    total: int
    system_events: int
    field_events: int
    office_events: int


class AuditEventItem(BaseModel):
    event_id: str
    event_type: str
    aggregate_type: str
    aggregate_id: str
    user_id: str | None = None
    user_name: str | None = None
    user_role: str | None = None
    actor_scope: str
    device_uid: str | None = None
    platform: str | None = None
    occurred_at_device: datetime | None = None
    recorded_at_server: datetime
    payload_json: dict
    metadata_json: dict
