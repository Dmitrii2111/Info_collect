from datetime import datetime

from pydantic import BaseModel


class PlanChangeSetListItem(BaseModel):
    id: str
    building_id: str
    old_plan_version_id: str
    new_plan_version_id: str
    status: str
    created_at: datetime
    summary: dict


class PlanChangeItemDetail(BaseModel):
    id: str
    change_type: str
    resolution_status: str
    resolution_action: str | None = None
    match_confidence: float | None = None
    old_planned_position_id: str | None = None
    new_planned_position_id: str | None = None
    old_room_id: str | None = None
    new_room_id: str | None = None
    old_payload: dict | None = None
    new_payload: dict | None = None
    comment_text: str | None = None


class PlanChangeSetDetail(BaseModel):
    id: str
    building_id: str
    old_plan_version_id: str
    new_plan_version_id: str
    status: str
    created_at: datetime
    summary: dict
    items: list[PlanChangeItemDetail]


class PlanChangeItemUpdateRequest(BaseModel):
    resolution_status: str | None = None
    resolution_action: str | None = None
    comment_text: str | None = None


class PlanChangeActionResponse(BaseModel):
    message: str
    change_set_id: str
    status: str
