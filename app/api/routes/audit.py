from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.audit import AuditEventItem, AuditSummaryResponse
from app.services.audit_queries import get_audit_summary, list_audit_events


router = APIRouter()


@router.get("/summary", response_model=AuditSummaryResponse)
def audit_summary(db: Session = Depends(get_db)) -> AuditSummaryResponse:
    return AuditSummaryResponse(**get_audit_summary(db))


@router.get("/events", response_model=list[AuditEventItem])
def audit_events(
    actor_scope: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    aggregate_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[AuditEventItem]:
    return [
        AuditEventItem(**row)
        for row in list_audit_events(
            db,
            actor_scope=actor_scope,
            event_type=event_type,
            aggregate_type=aggregate_type,
            limit=limit,
        )
    ]
