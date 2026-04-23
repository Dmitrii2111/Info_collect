from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import CheckType, CommunicationsStatus, ConflictStatus, ConflictType, ItemPresenceStatus, PnrStatus, RepeatCheckScope, RepeatCheckStatus, SerialState
from app.models.sqltypes import enum_column


class EquipmentInstance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "equipment_instances"
    __table_args__ = (
        CheckConstraint(
            "NOT (current_room_id IS NOT NULL AND current_storage_zone_id IS NOT NULL)",
            name="chk_equipment_instance_location",
        ),
    )

    planned_item_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_items.id"), nullable=False, unique=True)
    current_room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    current_storage_zone_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_zones.id"))
    current_presence_status: Mapped[ItemPresenceStatus] = mapped_column(enum_column(ItemPresenceStatus, "item_presence_status"), nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String)
    serial_state: Mapped[SerialState] = mapped_column(enum_column(SerialState, "serial_state"), nullable=False)
    pnr_status: Mapped[PnrStatus] = mapped_column(enum_column(PnrStatus, "pnr_status"), nullable=False)
    communications_status: Mapped[CommunicationsStatus] = mapped_column(enum_column(CommunicationsStatus, "communications_status"), nullable=False)
    actual_condition: Mapped[str | None] = mapped_column(String)
    completeness_status: Mapped[str | None] = mapped_column(String)
    last_check_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_checked_by: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    last_event_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"))
    version_no: Mapped[int] = mapped_column(nullable=False, default=1)


class RepeatCheck(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "repeat_checks"

    scope_type: Mapped[RepeatCheckScope] = mapped_column(enum_column(RepeatCheckScope, "repeat_check_scope"), nullable=False)
    room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    equipment_instance_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"))
    reason_text: Mapped[str | None] = mapped_column(String)
    status_code: Mapped[RepeatCheckStatus] = mapped_column(enum_column(RepeatCheckStatus, "repeat_check_status"), nullable=False)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ItemCheck(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "item_checks"

    equipment_instance_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"), nullable=False)
    planned_item_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_items.id"), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    check_type: Mapped[CheckType] = mapped_column(enum_column(CheckType, "check_type"), nullable=False)
    presence_status: Mapped[ItemPresenceStatus] = mapped_column(enum_column(ItemPresenceStatus, "item_presence_status"), nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String)
    serial_state: Mapped[SerialState] = mapped_column(enum_column(SerialState, "serial_state"), nullable=False)
    pnr_status: Mapped[PnrStatus] = mapped_column(enum_column(PnrStatus, "pnr_status"), nullable=False)
    communications_status: Mapped[CommunicationsStatus] = mapped_column(enum_column(CommunicationsStatus, "communications_status"), nullable=False)
    actual_condition: Mapped[str | None] = mapped_column(String)
    completeness_status: Mapped[str | None] = mapped_column(String)
    comment_text: Mapped[str | None] = mapped_column(String)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id"))
    created_at_device: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    sync_batch_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("sync_batches.id"))
    is_repeat_check: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    repeat_check_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("repeat_checks.id"))
    source_event_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"))


class ItemStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "item_status_history"

    equipment_instance_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"), nullable=False)
    status_code: Mapped[ItemPresenceStatus] = mapped_column(enum_column(ItemPresenceStatus, "item_presence_status"), nullable=False)
    comment_text: Mapped[str | None] = mapped_column(String)
    changed_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    changed_at_device: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    changed_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source_check_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("item_checks.id"))
    source_event_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"))


class PnrHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "pnr_history"

    equipment_instance_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"), nullable=False)
    pnr_status: Mapped[PnrStatus] = mapped_column(enum_column(PnrStatus, "pnr_status"), nullable=False)
    comment_text: Mapped[str | None] = mapped_column(String)
    changed_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    changed_at_device: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    changed_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source_check_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("item_checks.id"))
    source_event_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"))


class CommunicationHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "communication_history"

    equipment_instance_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"), nullable=False)
    communications_status: Mapped[CommunicationsStatus] = mapped_column(enum_column(CommunicationsStatus, "communications_status"), nullable=False)
    comment_text: Mapped[str | None] = mapped_column(String)
    changed_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    changed_at_device: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    changed_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source_check_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("item_checks.id"))
    source_event_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"))


class Conflict(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "conflicts"

    conflict_type: Mapped[ConflictType] = mapped_column(enum_column(ConflictType, "conflict_type"), nullable=False)
    equipment_instance_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_instances.id"))
    room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    first_event_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"), nullable=False)
    second_event_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("domain_events.id"), nullable=False)
    status_code: Mapped[ConflictStatus] = mapped_column(enum_column(ConflictStatus, "conflict_status"), nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolution_note: Mapped[str | None] = mapped_column(String)
