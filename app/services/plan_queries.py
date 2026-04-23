from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import PlanVersionStatus
from app.models.org import Building
from app.models.plan import PlanChangeSet, PlanVersion


def list_plan_versions(session: Session) -> list[tuple[PlanVersion, Building]]:
    return session.execute(
        select(PlanVersion, Building)
        .join(Building, Building.id == PlanVersion.building_id)
        .order_by(PlanVersion.created_at.desc())
    ).all()


def list_plan_change_sets(session: Session) -> list[PlanChangeSet]:
    return session.execute(
        select(PlanChangeSet).order_by(PlanChangeSet.created_at.desc())
    ).scalars().all()


def get_effective_plan_version_id(session: Session, plan_version_id: str | None = None) -> str | None:
    if plan_version_id:
        return plan_version_id

    active_version = session.execute(
        select(PlanVersion.id)
        .where(PlanVersion.status_code == PlanVersionStatus.APPLIED)
        .order_by(PlanVersion.applied_at.desc().nullslast(), PlanVersion.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    return str(active_version) if active_version else None
