from datetime import datetime

from pydantic import BaseModel, Field


class StorageZoneListItem(BaseModel):
    storage_zone_id: str
    code: str
    name: str
    zone_type: str
    room_id: str | None = None
    room_code: str | None = None
    room_name: str | None = None
    is_active: bool = True
    quantity_on_hand: int = 0
    movements_count: int = 0
    opened_at: datetime | None = None


class WarehouseReceiptListItem(BaseModel):
    warehouse_receipt_id: str
    receipt_no: str | None = None
    target_storage_zone_id: str
    target_storage_zone_name: str
    status_code: str
    created_at: datetime | None = None
    confirmed_at: datetime | None = None
    created_by_name: str | None = None
    items_count: int = 0
    total_declared_quantity: int = 0
    total_actual_quantity: int = 0
    issues_count: int = 0


class StockOverviewResponse(BaseModel):
    storage_zones_count: int = 0
    active_storage_zones_count: int = 0
    receipts_count: int = 0
    pending_receipts_count: int = 0
    movements_count: int = 0
    quantity_on_hand: int = 0


class StorageZoneCreateRequest(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    room_id: str | None = None


class WarehouseReceiptItemInput(BaseModel):
    position_code: str = Field(min_length=1, max_length=150)
    planned_position_id: str | None = None
    equipment_name: str = Field(min_length=1, max_length=255)
    model_mark: str | None = Field(default=None, max_length=255)
    category_id: str | None = None
    declared_quantity: int = Field(ge=0)
    actual_quantity: int = Field(ge=0)
    condition_status: str = Field(min_length=1, max_length=50)
    completeness_status: str | None = Field(default=None, max_length=255)
    photo_refs: list[str] = Field(default_factory=list)
    comment_text: str | None = None


class WarehouseReceiptCreateRequest(BaseModel):
    receipt_no: str | None = Field(default=None, max_length=150)
    building_id: str | None = None
    target_storage_zone_id: str | None = None
    comment_text: str | None = None
    items: list[WarehouseReceiptItemInput] = Field(min_length=1)


class WarehouseReceiptItemResponse(BaseModel):
    warehouse_receipt_item_id: str
    position_code: str
    planned_position_id: str | None = None
    equipment_name: str
    model_mark: str | None = None
    category_id: str | None = None
    declared_quantity: int
    actual_quantity: int
    condition_status: str | None = None
    completeness_status: str | None = None
    status_code: str
    placement_status: str
    photo_refs: list[str] = Field(default_factory=list)
    comment_text: str | None = None
    created_at: datetime | None = None


class WarehouseReceiptDetailResponse(BaseModel):
    warehouse_receipt_id: str
    receipt_no: str | None = None
    building_id: str
    target_storage_zone_id: str
    target_storage_zone_name: str | None = None
    status_code: str
    created_at: datetime | None = None
    confirmed_at: datetime | None = None
    created_by_name: str | None = None
    comment_text: str | None = None
    items: list[WarehouseReceiptItemResponse] = Field(default_factory=list)


class WarehouseReceiptConfirmRequest(BaseModel):
    comment_text: str | None = None


class WarehouseReceiptIssueItem(BaseModel):
    issue_id: str
    issue_type: str
    warehouse_receipt_item_id: str
    position_code: str
    equipment_name: str
    declared_quantity: int
    actual_quantity: int
    delta_quantity: int
    storage_zone_id: str | None = None
    storage_zone_name: str | None = None
    conflict_id: str | None = None
    follow_up_task_id: str | None = None
    status_code: str


class WarehouseReceiptIssueResolveRequest(BaseModel):
    action: str = Field(min_length=1, max_length=100)
    comment_text: str | None = None


class WarehouseReceiptIssueResolveResponse(BaseModel):
    issue_id: str
    action: str
    status_code: str
