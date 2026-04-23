from pydantic import BaseModel
from datetime import datetime


class RoomStatusFlags(BaseModel):
    has_unchecked_items: bool = False
    has_missing_items: bool = False
    has_conflict_items: bool = False
    has_no_serial_items: bool = False
    has_pnr_attention_items: bool = False


class RoomWorklistSummary(BaseModel):
    unchecked: int = 0
    missing: int = 0
    conflict: int = 0
    no_serial: int = 0
    pnr_attention: int = 0


class RoomListItem(BaseModel):
    room_id: str
    plan_version_id: str | None = None
    room_code: str
    room_name: str
    floor_code: str | None = None
    department_name: str | None = None
    planned_positions_count: int = 0
    planned_items_count: int = 0
    status_flags: RoomStatusFlags
    repeat_check_required: bool = False
    completed_at: datetime | None = None


class RoomItemDetail(BaseModel):
    planned_item_id: str
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


class RoomPositionDetail(BaseModel):
    planned_position_id: str
    position_code: str
    equipment_name: str
    model_mark: str | None = None
    planned_quantity: int
    items: list[RoomItemDetail]


class RoomDetail(BaseModel):
    room_id: str
    plan_version_id: str | None = None
    room_code: str
    room_name: str
    floor_code: str | None = None
    department_name: str | None = None
    building_code: str
    status_flags: RoomStatusFlags
    positions: list[RoomPositionDetail]


class RoomSummaryResponse(BaseModel):
    plan_version_id: str | None = None
    total: int
    worklist: RoomWorklistSummary


class RoomCompletionEmployeeStat(BaseModel):
    user_id: str | None = None
    full_name: str
    completed_rooms_count: int = 0


class RoomCompletionDayStat(BaseModel):
    date: str
    total_completed_rooms: int = 0
    employees: list[RoomCompletionEmployeeStat]


class RoomCompletionActivityResponse(BaseModel):
    plan_version_id: str | None = None
    days: list[RoomCompletionDayStat]


class AssignmentSummary(BaseModel):
    user_id: str
    rooms: list[RoomListItem]
