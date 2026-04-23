from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.enums import CategoryCode, ChangeResolutionAction, ChangeResolutionStatus, ChangeSetStatus, ChangeType, PlanVersionStatus
from app.models.sqltypes import enum_column


class EquipmentCategory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "equipment_categories"

    code: Mapped[CategoryCode] = mapped_column(enum_column(CategoryCode, "category_code"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PlanVersion(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "plan_versions"
    __table_args__ = (UniqueConstraint("building_id", "version_no", name="uq_plan_version_per_building"),)

    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    version_label: Mapped[str] = mapped_column(String, nullable=False)
    source_file_name: Mapped[str] = mapped_column(String, nullable=False)
    status_code: Mapped[PlanVersionStatus] = mapped_column(enum_column(PlanVersionStatus, "plan_version_status"), nullable=False)
    import_session_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("import_sessions.id"), nullable=False)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    comment_text: Mapped[str | None] = mapped_column(String)


class PlannedPosition(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "planned_positions"
    __table_args__ = (
        UniqueConstraint("import_session_id", "source_sheet_name", "source_row_number", name="uq_import_source_row"),
    )

    plan_version_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("plan_versions.id"), nullable=False)
    import_session_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("import_sessions.id"), nullable=False)
    source_sheet_name: Mapped[str] = mapped_column(String, nullable=False)
    source_row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    line_no: Mapped[int | None] = mapped_column(Integer)
    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    category_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_categories.id"), nullable=False)
    position_code: Mapped[str] = mapped_column(String, nullable=False)
    equipment_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String)
    model_mark: Mapped[str | None] = mapped_column(String)
    manufacturer: Mapped[str | None] = mapped_column(String)
    planned_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_name: Mapped[str | None] = mapped_column(String)
    mounting_type: Mapped[str | None] = mapped_column(String)
    equipment_type: Mapped[str | None] = mapped_column(String)
    dimensions_text: Mapped[str | None] = mapped_column(String)
    weight_text: Mapped[str | None] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String)
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PlannedItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "planned_items"
    __table_args__ = (UniqueConstraint("planned_position_id", "ordinal_no", name="uq_planned_item_ordinal"),)

    planned_position_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_positions.id"), nullable=False)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    ordinal_no: Mapped[int] = mapped_column(Integer, nullable=False)
    display_label: Mapped[str] = mapped_column(String, nullable=False)
    requires_serial: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    serial_policy: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PlanChangeSet(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "plan_change_sets"

    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    old_plan_version_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("plan_versions.id"), nullable=False)
    new_plan_version_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("plan_versions.id"), nullable=False)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status_code: Mapped[ChangeSetStatus] = mapped_column(enum_column(ChangeSetStatus, "change_set_status"), nullable=False)
    summary_json: Mapped[dict] = mapped_column(JSONB, nullable=False)


class PlanChangeItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "plan_change_items"

    plan_change_set_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("plan_change_sets.id"), nullable=False)
    change_type: Mapped[ChangeType] = mapped_column(enum_column(ChangeType, "change_type"), nullable=False)
    match_confidence: Mapped[float | None] = mapped_column(Numeric(5, 2))
    old_planned_position_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_positions.id"))
    new_planned_position_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("planned_positions.id"))
    old_room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    new_room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    old_payload: Mapped[dict | None] = mapped_column(JSONB)
    new_payload: Mapped[dict | None] = mapped_column(JSONB)
    resolution_status: Mapped[ChangeResolutionStatus] = mapped_column(
        enum_column(ChangeResolutionStatus, "change_resolution_status"),
        nullable=False,
    )
    resolution_action: Mapped[ChangeResolutionAction | None] = mapped_column(
        enum_column(ChangeResolutionAction, "change_resolution_action")
    )
    resolved_by: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    comment_text: Mapped[str | None] = mapped_column(String)
