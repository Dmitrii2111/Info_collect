from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.enums import (
    ConditionStatus,
    FollowUpTaskStatus,
    FollowUpTaskType,
    MovementType,
    PlacementStatus,
    ReceiptItemStatus,
    ReceiptStatus,
    StorageZoneType,
)
from app.models.sqltypes import enum_column


class StorageZone(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "storage_zones"
    __table_args__ = (UniqueConstraint("building_id", "code", name="uq_storage_zone_code_per_building"),)

    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    zone_type: Mapped[StorageZoneType] = mapped_column(enum_column(StorageZoneType, "storage_zone_type"), nullable=False)
    room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class WarehouseReceipt(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "warehouse_receipts"

    receipt_no: Mapped[str | None] = mapped_column(String)
    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    target_storage_zone_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_zones.id"), nullable=False)
    status_code: Mapped[ReceiptStatus] = mapped_column(enum_column(ReceiptStatus, "receipt_status"), nullable=False)
    source_import_session_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("import_sessions.id"))
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    comment_text: Mapped[str | None] = mapped_column(String)


class WarehouseReceiptItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "warehouse_receipt_items"

    warehouse_receipt_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouse_receipts.id"), nullable=False)
    position_code: Mapped[str] = mapped_column(String, nullable=False)
    planned_position_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_positions.id"))
    equipment_name: Mapped[str] = mapped_column(String, nullable=False)
    model_mark: Mapped[str | None] = mapped_column(String)
    category_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_categories.id"))
    declared_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    condition_status: Mapped[ConditionStatus | None] = mapped_column(enum_column(ConditionStatus, "condition_status"))
    completeness_status: Mapped[str | None] = mapped_column(String)
    status_code: Mapped[ReceiptItemStatus] = mapped_column(enum_column(ReceiptItemStatus, "receipt_item_status"), nullable=False)
    placement_status: Mapped[PlacementStatus] = mapped_column(
        enum_column(PlacementStatus, "placement_status"),
        nullable=False,
    )
    photo_refs_json: Mapped[dict | list | None] = mapped_column(JSONB)
    comment_text: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class WarehouseReceiptConfirmation(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "warehouse_receipt_confirmations"

    warehouse_receipt_item_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("warehouse_receipt_items.id"),
        nullable=False,
    )
    confirmed_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    confirmed_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    condition_status: Mapped[ConditionStatus | None] = mapped_column(enum_column(ConditionStatus, "condition_status"))
    completeness_status: Mapped[str | None] = mapped_column(String)
    comment_text: Mapped[str | None] = mapped_column(String)
    photo_refs_json: Mapped[dict | list | None] = mapped_column(JSONB)
    created_at_device: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    device_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id"))


class StockBalance(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "stock_balances"
    __table_args__ = (
        CheckConstraint(
            "planned_item_id IS NOT NULL OR planned_position_id IS NOT NULL OR warehouse_receipt_item_id IS NOT NULL",
            name="chk_stock_balance_target",
        ),
    )

    storage_zone_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_zones.id"), nullable=False)
    planned_item_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_items.id"))
    planned_position_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_positions.id"))
    warehouse_receipt_item_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("warehouse_receipt_items.id"),
    )
    quantity_on_hand: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StockMovement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "stock_movements"

    movement_type: Mapped[MovementType] = mapped_column(enum_column(MovementType, "movement_type"), nullable=False)
    equipment_instance_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"))
    planned_position_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_positions.id"))
    from_storage_zone_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_zones.id"))
    to_storage_zone_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_zones.id"))
    to_room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason_text: Mapped[str | None] = mapped_column(String)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at_device: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source_receipt_item_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouse_receipt_items.id"))
    source_event_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"))


class ReceiptFollowUpTask(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "receipt_follow_up_tasks"

    warehouse_receipt_item_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("warehouse_receipt_items.id"),
        nullable=False,
    )
    task_type: Mapped[FollowUpTaskType] = mapped_column(enum_column(FollowUpTaskType, "follow_up_task_type"), nullable=False)
    required_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status_code: Mapped[FollowUpTaskStatus] = mapped_column(
        enum_column(FollowUpTaskStatus, "follow_up_task_status"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resolved_by: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    comment_text: Mapped[str | None] = mapped_column(String)
