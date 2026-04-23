from datetime import datetime

from pydantic import BaseModel


class PlanVersionListItem(BaseModel):
    id: str
    building_code: str
    version_no: int
    version_label: str
    status: str
    source_file_name: str
    created_at: datetime
    applied_at: datetime | None = None
    comment_text: str | None = None
    planned_positions_count: int = 0
    planned_items_count: int = 0
