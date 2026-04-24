from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import ConflictStatus
from app.schemas.conflicts import (
    ConflictListItem,
    ConflictSummaryResponse,
    ConflictUpdateRequest,
    ConflictUpdateResponse,
)
from app.services.conflict_actions import update_conflict_status
from app.services.conflict_queries import get_conflicts_summary, list_conflicts
from app.services.system_user import get_or_create_system_user


router = APIRouter()


@router.get("/summary", response_model=ConflictSummaryResponse)
def conflicts_summary(db: Session = Depends(get_db)) -> ConflictSummaryResponse:
    return ConflictSummaryResponse(**get_conflicts_summary(db))


@router.get("", response_model=list[ConflictListItem])
def conflicts_list(
    status_code: str | None = None,
    conflict_type: str | None = None,
    db: Session = Depends(get_db),
) -> list[ConflictListItem]:
    return [ConflictListItem(**row) for row in list_conflicts(db, status_code=status_code, conflict_type=conflict_type)]


@router.patch("/{conflict_id}", response_model=ConflictUpdateResponse)
def conflicts_update(conflict_id: str, payload: ConflictUpdateRequest, db: Session = Depends(get_db)) -> ConflictUpdateResponse:
    system_user = get_or_create_system_user(db)
    try:
        status_code = ConflictStatus(payload.status_code)
        conflict = update_conflict_status(
            db,
            conflict_id=conflict_id,
            status_code=status_code,
            resolved_by=system_user.id,
            resolution_note=payload.resolution_note,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ConflictUpdateResponse(
        message="Conflict updated",
        conflict_id=str(conflict.id),
        status_code=conflict.status_code.value,
    )

