from datetime import datetime

from pydantic import BaseModel, Field


class StorageZoneListItem(BaseModel):
    storage_zone_id: str
    code: str
    name: str
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

