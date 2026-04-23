from datetime import datetime

from pydantic import BaseModel, Field


class SyncBatchItemRequest(BaseModel):
    client_item_id: str
    action_type: str
    event_uid: str
    planned_item_id: str | None = None
    room_id: str | None = None
    presence_status: str | None = None
    serial_state: str | None = None
    serial_number: str | None = None
    pnr_status: str | None = None
    communications_status: str | None = None
    actual_condition: str | None = None
    completeness_status: str | None = None
    comment_text: str | None = Field(default=None, max_length=2000)
    created_at_device: datetime | None = None
    is_repeat_check: bool = False
    repeat_check_id: str | None = None
    checked_items_count: int | None = None


class SyncBatchRequest(BaseModel):
    batch_uid: str
    worker_login: str
    worker_full_name: str | None = None
    device_uid: str
    platform: str
    app_version: str | None = None
    sent_at_device: datetime
    items: list[SyncBatchItemRequest]


class SyncBatchItemResponse(BaseModel):
    client_item_id: str
    action_type: str
    status: str
    message: str
    event_uid: str
    aggregate_id: str | None = None
    conflict_created: bool = False


class SyncBatchResponse(BaseModel):
    batch_uid: str
    batch_id: str
    status: str
    items_count: int
    processed_count: int
    duplicate_count: int
    error_count: int
    results: list[SyncBatchItemResponse]
