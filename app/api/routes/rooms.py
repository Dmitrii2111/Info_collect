from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.rooms import AssignmentSummary, RoomCompletionActivityResponse, RoomDetail, RoomListItem, RoomSummaryResponse
from app.services.room_queries import get_room_completion_activity, get_room_detail, get_rooms_summary, list_rooms_with_counts


router = APIRouter()


@router.get("/", response_model=list[RoomListItem])
def list_rooms(
    plan_version_id: str | None = None,
    worklist_filter: str | None = None,
    db: Session = Depends(get_db),
) -> list[RoomListItem]:
    rows = list_rooms_with_counts(db, plan_version_id=plan_version_id, worklist_filter=worklist_filter)
    return [RoomListItem(**row) for row in rows]


@router.get("/summary", response_model=RoomSummaryResponse)
def rooms_summary(plan_version_id: str | None = None, db: Session = Depends(get_db)) -> RoomSummaryResponse:
    payload = get_rooms_summary(db, plan_version_id=plan_version_id)
    return RoomSummaryResponse(**payload)


@router.get("/completion-activity", response_model=RoomCompletionActivityResponse)
def room_completion_activity(
    plan_version_id: str | None = None,
    limit_days: int = 14,
    db: Session = Depends(get_db),
) -> RoomCompletionActivityResponse:
    payload = get_room_completion_activity(db, plan_version_id=plan_version_id, limit_days=limit_days)
    return RoomCompletionActivityResponse(**payload)


@router.get("/{room_id}", response_model=RoomDetail)
def room_detail(room_id: str, plan_version_id: str | None = None, db: Session = Depends(get_db)) -> RoomDetail:
    payload = get_room_detail(db, room_id, plan_version_id=plan_version_id)
    if payload is None:
        raise HTTPException(status_code=404, detail=f"Room not found: {room_id}")
    return RoomDetail(**payload)


@router.get("/assignments/{user_id}", response_model=AssignmentSummary)
def get_user_assignments(user_id: str) -> AssignmentSummary:
    return AssignmentSummary(user_id=user_id, rooms=[])
