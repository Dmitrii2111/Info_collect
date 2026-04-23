from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import (
    ChangeResolutionAction,
    ChangeResolutionStatus,
    ChangeSetStatus,
    ChangeType,
    PlanVersionStatus,
)
from app.models.plan import PlanChangeItem, PlanChangeSet, PlanVersion


def _default_action_for_item(item: PlanChangeItem) -> ChangeResolutionAction:
    if item.change_type in {ChangeType.ROOM_ADDED, ChangeType.POSITION_ADDED}:
        return ChangeResolutionAction.CREATE_NEW
    if item.change_type in {ChangeType.ROOM_REMOVED, ChangeType.POSITION_REMOVED}:
        return ChangeResolutionAction.ARCHIVE_OLD
    if item.change_type == ChangeType.POSITION_MOVED:
        return ChangeResolutionAction.MOVE_ROOM
    if item.change_type == ChangeType.QUANTITY_CHANGED:
        old_qty = (item.old_payload or {}).get("planned_quantity")
        new_qty = (item.new_payload or {}).get("planned_quantity")
        if old_qty is not None and new_qty is not None and new_qty >= old_qty:
            return ChangeResolutionAction.INCREASE_INSTANCES
        return ChangeResolutionAction.DECREASE_INSTANCES
    return ChangeResolutionAction.MANUAL_RESOLUTION


def get_change_set_or_404(session: Session, change_set_id: str) -> PlanChangeSet | None:
    return session.scalar(select(PlanChangeSet).where(PlanChangeSet.id == change_set_id))


def get_change_item_or_404(session: Session, change_set_id: str, item_id: str) -> PlanChangeItem | None:
    return session.scalar(
        select(PlanChangeItem).where(
            PlanChangeItem.id == item_id,
            PlanChangeItem.plan_change_set_id == change_set_id,
        )
    )


def update_change_item(
    session: Session,
    *,
    change_set_id: str,
    item_id: str,
    resolution_status: ChangeResolutionStatus | None,
    resolution_action: ChangeResolutionAction | None,
    comment_text: str | None,
    resolved_by,
) -> PlanChangeSet:
    change_set = get_change_set_or_404(session, change_set_id)
    item = get_change_item_or_404(session, change_set_id, item_id)
    if change_set is None or item is None:
        raise ValueError("Change set or item not found")

    if resolution_status is not None:
        item.resolution_status = resolution_status
    if resolution_action is not None:
        item.resolution_action = resolution_action
    if comment_text is not None:
        item.comment_text = comment_text

    item.resolved_by = resolved_by
    item.resolved_at = datetime.now(timezone.utc)

    pending_exists = session.scalar(
        select(PlanChangeItem.id).where(
            PlanChangeItem.plan_change_set_id == change_set.id,
            PlanChangeItem.resolution_status.in_(
                [ChangeResolutionStatus.PENDING, ChangeResolutionStatus.REQUIRES_REVIEW]
            ),
        )
    )
    if pending_exists is None and change_set.status_code == ChangeSetStatus.READY_FOR_REVIEW:
        change_set.status_code = ChangeSetStatus.APPROVED

    session.flush()
    return change_set


def approve_change_set(session: Session, *, change_set_id: str, resolved_by) -> PlanChangeSet:
    change_set = get_change_set_or_404(session, change_set_id)
    if change_set is None:
        raise ValueError("Change set not found")

    items = session.execute(
        select(PlanChangeItem).where(PlanChangeItem.plan_change_set_id == change_set.id)
    ).scalars().all()

    for item in items:
        if item.resolution_action is None:
            item.resolution_action = _default_action_for_item(item)
        if item.resolution_status in {ChangeResolutionStatus.PENDING, ChangeResolutionStatus.REQUIRES_REVIEW}:
            item.resolution_status = ChangeResolutionStatus.APPROVED
        item.resolved_by = resolved_by
        item.resolved_at = datetime.now(timezone.utc)

    change_set.status_code = ChangeSetStatus.APPROVED

    new_plan = session.scalar(select(PlanVersion).where(PlanVersion.id == change_set.new_plan_version_id))
    if new_plan is not None and new_plan.status_code == PlanVersionStatus.DIFF_READY:
        new_plan.status_code = PlanVersionStatus.APPROVED

    session.flush()
    return change_set


def apply_change_set(session: Session, *, change_set_id: str, resolved_by) -> PlanChangeSet:
    change_set = get_change_set_or_404(session, change_set_id)
    if change_set is None:
        raise ValueError("Change set not found")

    items = session.execute(
        select(PlanChangeItem).where(PlanChangeItem.plan_change_set_id == change_set.id)
    ).scalars().all()

    unresolved = [
        item.id
        for item in items
        if item.resolution_status not in {
            ChangeResolutionStatus.APPROVED,
            ChangeResolutionStatus.AUTO_MATCHED,
            ChangeResolutionStatus.APPLIED,
        }
    ]
    if unresolved:
        raise RuntimeError("Cannot apply change set while unresolved items remain")

    old_plan = session.scalar(select(PlanVersion).where(PlanVersion.id == change_set.old_plan_version_id))
    new_plan = session.scalar(select(PlanVersion).where(PlanVersion.id == change_set.new_plan_version_id))
    if new_plan is None:
        raise RuntimeError("New plan version not found")

    for item in items:
        if item.resolution_action is None:
            item.resolution_action = _default_action_for_item(item)
        item.resolution_status = ChangeResolutionStatus.APPLIED
        item.resolved_by = resolved_by
        item.resolved_at = datetime.now(timezone.utc)

    change_set.status_code = ChangeSetStatus.APPLIED

    if old_plan is not None and old_plan.status_code == PlanVersionStatus.APPLIED:
        old_plan.status_code = PlanVersionStatus.APPROVED

    new_plan.status_code = PlanVersionStatus.APPLIED
    new_plan.applied_at = datetime.now(timezone.utc)

    session.flush()
    return change_set
