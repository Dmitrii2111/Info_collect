from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.enums import ExportType, ImportRowStatus, ImportStatus, ImportType, SyncBatchStatus
from app.models.sqltypes import enum_column


class ImportSession(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "import_sessions"

    import_type: Mapped[ImportType] = mapped_column(enum_column(ImportType, "import_type"), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    source_path: Mapped[str | None] = mapped_column(String)
    status_code: Mapped[ImportStatus] = mapped_column(enum_column(ImportStatus, "import_status"), nullable=False)
    started_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    summary_json: Mapped[dict] = mapped_column(JSONB, nullable=False)


class ImportRow(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "import_rows"

    import_session_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("import_sessions.id"), nullable=False)
    sheet_name: Mapped[str] = mapped_column(String, nullable=False)
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status_code: Mapped[ImportRowStatus] = mapped_column(enum_column(ImportRowStatus, "import_row_status"), nullable=False)
    message_text: Mapped[str | None] = mapped_column(String)
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)


class ExportSession(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "export_sessions"

    export_type: Mapped[ExportType] = mapped_column(enum_column(ExportType, "export_type"), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    requested_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    filters_json: Mapped[dict] = mapped_column(JSONB, nullable=False)


class SyncBatch(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "sync_batches"

    device_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    batch_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    sent_at_device: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    items_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status_code: Mapped[SyncBatchStatus] = mapped_column(enum_column(SyncBatchStatus, "sync_batch_status"), nullable=False)
    error_text: Mapped[str | None] = mapped_column(String)


class DomainEvent(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "domain_events"

    event_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    aggregate_type: Mapped[str] = mapped_column(String, nullable=False)
    aggregate_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False)
    user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    device_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id"))
    sync_batch_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("sync_batches.id"))
    occurred_at_device: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    recorded_at_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
