from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.plan import PlanChangeItem, PlanChangeSet


def list_change_sets(session: Session) -> list[dict]:
    rows = session.execute(
        select(PlanChangeSet).order_by(PlanChangeSet.created_at.desc())
    ).scalars().all()

    return [
        {
            "id": str(item.id),
            "building_id": str(item.building_id),
            "old_plan_version_id": str(item.old_plan_version_id),
            "new_plan_version_id": str(item.new_plan_version_id),
            "status": item.status_code.value,
            "created_at": item.created_at,
            "summary": item.summary_json,
        }
        for item in rows
    ]


def get_change_set_detail(session: Session, change_set_id: str) -> dict | None:
    change_set = session.scalar(
        select(PlanChangeSet).where(PlanChangeSet.id == change_set_id)
    )
    if change_set is None:
        return None

    items = session.execute(
        select(PlanChangeItem)
        .where(PlanChangeItem.plan_change_set_id == change_set.id)
        .order_by(PlanChangeItem.change_type.asc(), PlanChangeItem.id.asc())
    ).scalars().all()

    return {
        "id": str(change_set.id),
        "building_id": str(change_set.building_id),
        "old_plan_version_id": str(change_set.old_plan_version_id),
        "new_plan_version_id": str(change_set.new_plan_version_id),
        "status": change_set.status_code.value,
        "created_at": change_set.created_at,
        "summary": change_set.summary_json,
        "items": [
            {
                "id": str(item.id),
                "change_type": item.change_type.value,
                "resolution_status": item.resolution_status.value,
                "resolution_action": item.resolution_action.value if item.resolution_action else None,
                "match_confidence": float(item.match_confidence) if item.match_confidence is not None else None,
                "old_planned_position_id": str(item.old_planned_position_id) if item.old_planned_position_id else None,
                "new_planned_position_id": str(item.new_planned_position_id) if item.new_planned_position_id else None,
                "old_room_id": str(item.old_room_id) if item.old_room_id else None,
                "new_room_id": str(item.new_room_id) if item.new_room_id else None,
                "old_payload": item.old_payload,
                "new_payload": item.new_payload,
                "comment_text": item.comment_text,
            }
            for item in items
        ],
    }
