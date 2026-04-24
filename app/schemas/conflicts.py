from datetime import datetime

from pydantic import BaseModel


class ConflictSummaryResponse(BaseModel):
    total: int = 0
    open: int = 0
    resolved: int = 0
    dismissed: int = 0


class ConflictListItem(BaseModel):
    conflict_id: str
    conflict_type: str
    status_code: str
    detected_at: datetime | None = None
    resolved_at: datetime | None = None
    room_id: str | None = None
    room_code: str | None = None
    room_name: str | None = None
    equipment_instance_id: str | None = None
    planned_item_id: str | None = None
    display_label: str | None = None
    equipment_name: str | None = None
    first_event_type: str | None = None
    second_event_type: str | None = None
    first_user_name: str | None = None
    second_user_name: str | None = None
    resolution_note: str | None = None


class ConflictUpdateRequest(BaseModel):
    status_code: str
    resolution_note: str | None = None


class ConflictUpdateResponse(BaseModel):
    message: str
    conflict_id: str
    status_code: str

