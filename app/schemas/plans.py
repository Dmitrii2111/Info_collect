from datetime import datetime

from pydantic import BaseModel, Field


class PlanImportRequest(BaseModel):
    source_path: str = Field(..., description="Absolute or workspace-local path to source xlsx file.")
    building_code: str = Field(default="default-building")
    building_name: str = Field(default="Default building")
    version_label: str
    category_code: str = Field(default="furniture")
    comment_text: str | None = None


class PlanImportSummary(BaseModel):
    imported_rooms: int
    imported_positions: int
    imported_items: int
    detected_changes: int = 0
    change_set_id: str | None = None


class PlanVersionResponse(BaseModel):
    id: str
    building_code: str
    version_no: int
    version_label: str
    status: str
    source_file_name: str
    created_at: datetime
    applied_at: datetime | None = None
    comment_text: str | None = None


class PlanImportResponse(BaseModel):
    import_session_id: str
    plan_version: PlanVersionResponse
    summary: PlanImportSummary
