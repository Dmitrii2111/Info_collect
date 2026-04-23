from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.items import EquipmentItemListItem
from app.schemas.rooms import RoomListItem


class FieldAssignmentsResponse(BaseModel):
    worker_login: str
    worker_full_name: str
    plan_version_id: str | None = None
    assignment_mode: str
    rooms: list[RoomListItem]


class FieldItemCheckRequest(BaseModel):
    worker_login: str
    worker_full_name: str | None = None
    planned_item_id: str
    device_uid: str
    platform: str
    app_version: str | None = None
    presence_status: str
    serial_state: str
    serial_number: str | None = None
    pnr_status: str
    communications_status: str
    actual_condition: str | None = None
    completeness_status: str | None = None
    comment_text: str | None = Field(default=None, max_length=2000)
    created_at_device: datetime | None = None
    event_uid: str | None = None
    is_repeat_check: bool = False
    repeat_check_id: str | None = None


class FieldItemCheckResponse(BaseModel):
    message: str
    equipment_instance_id: str
    planned_item_id: str
    checked_by: str
    device_id: str
    conflict_created: bool = False


class RoomCompletionRequest(BaseModel):
    worker_login: str
    worker_full_name: str | None = None
    device_uid: str
    platform: str
    app_version: str | None = None
    comment_text: str | None = Field(default=None, max_length=2000)
    created_at_device: datetime | None = None
    event_uid: str | None = None
    checked_items_count: int | None = None


class RoomCompletionResponse(BaseModel):
    message: str
    room_id: str
    room_code: str
    completed_by: str
    device_id: str
    recorded_at: datetime


class FieldLookupEntry(BaseModel):
    code: str
    label: str


class FieldLookups(BaseModel):
    presence_statuses: list[FieldLookupEntry]
    serial_states: list[FieldLookupEntry]
    pnr_statuses: list[FieldLookupEntry]
    communications_statuses: list[FieldLookupEntry]


class FieldDeviceInfo(BaseModel):
    device_id: str
    device_uid: str
    platform: str
    app_version: str | None = None
    last_seen_at: datetime | None = None


class FieldBootstrapResponse(BaseModel):
    worker_login: str
    worker_full_name: str
    plan_version_id: str | None = None
    synced_at: datetime
    assignment_mode: str
    assigned_rooms_count: int
    completed_rooms_count: int
    device: FieldDeviceInfo
    rooms: list[RoomListItem]
    items: list[EquipmentItemListItem]
    lookups: FieldLookups
