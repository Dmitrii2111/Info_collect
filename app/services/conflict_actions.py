from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ConflictStatus
from app.models.inventory import Conflict


def update_conflict_status(
    db: Session,
    *,
    conflict_id: str,
    status_code: ConflictStatus,
    resolved_by: str,
    resolution_note: str | None = None,
) -> Conflict:
    conflict = db.execute(select(Conflict).where(Conflict.id == conflict_id)).scalar_one_or_none()
    if conflict is None:
        raise ValueError("Conflict not found.")

    conflict.status_code = status_code
    conflict.resolution_note = resolution_note
    if status_code in {ConflictStatus.RESOLVED, ConflictStatus.DISMISSED}:
        conflict.resolved_by = resolved_by
        conflict.resolved_at = datetime.now(timezone.utc)
    else:
        conflict.resolved_by = None
        conflict.resolved_at = None

    db.add(conflict)
    db.flush()
    return conflict

