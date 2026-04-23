from datetime import datetime

from pydantic import BaseModel, Field


class WorklistSummary(BaseModel):
    unchecked: int = 0
    missing: int = 0
    conflict: int = 0
    no_serial: int = 0
    pnr_attention: int = 0


class ItemHistoryEntry(BaseModel):
    entry_type: str
    value: str
    comment_text: str | None = None
    changed_by: str
    changed_at_server: datetime


class EquipmentItemDetail(BaseModel):
    equipment_instance_id: str
    planned_item_id: str
    plan_version_id: str | None = None
    room_id: str | None = None
    room_code: str | None = None
    room_name: str | None = None
    floor_code: str | None = None
    department_name: str | None = None
    storage_zone_id: str | None = None
    current_presence_status: str
    serial_state: str
    serial_number: str | None = None
    pnr_status: str
    communications_status: str
    actual_condition: str | None = None
    completeness_status: str | None = None
    last_check_at: datetime | None = None
    last_checked_by_name: str | None = None
    position_code: str
    equipment_name: str
    model_mark: str | None = None
    display_label: str
    status_history: list[ItemHistoryEntry]
    pnr_history: list[ItemHistoryEntry]
    communications_history: list[ItemHistoryEntry]


class EquipmentItemListItem(BaseModel):
    equipment_instance_id: str
    planned_item_id: str
    plan_version_id: str | None = None
    room_id: str | None = None
    room_code: str | None = None
    room_name: str | None = None
    floor_code: str | None = None
    department_name: str | None = None
    position_code: str
    equipment_name: str
    model_mark: str | None = None
    display_label: str
    current_presence_status: str
    serial_state: str
    serial_number: str | None = None
    pnr_status: str
    communications_status: str
    actual_condition: str | None = None
    completeness_status: str | None = None
    last_check_at: datetime | None = None
    last_checked_by_name: str | None = None


class EquipmentItemListResponse(BaseModel):
    total: int
    items: list[EquipmentItemListItem]


class EquipmentItemSummaryResponse(BaseModel):
    plan_version_id: str | None = None
    total: int
    worklist: WorklistSummary


class EquipmentItemUpdateRequest(BaseModel):
    presence_status: str | None = None
    serial_state: str | None = None
    serial_number: str | None = None
    pnr_status: str | None = None
    communications_status: str | None = None
    actual_condition: str | None = None
    completeness_status: str | None = None
    comment_text: str | None = Field(default=None, max_length=2000)


class EquipmentItemUpdateResponse(BaseModel):
    message: str
    equipment_instance_id: str
    planned_item_id: str
