from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import CheckType, CommunicationsStatus, ItemPresenceStatus, PnrStatus, SerialState
from app.models.inventory import CommunicationHistory, EquipmentInstance, ItemCheck, ItemStatusHistory, PnrHistory
from app.models.sync import DomainEvent


def update_item_by_operator(
    session: Session,
    *,
    planned_item_id: str,
    changed_by,
    presence_status: ItemPresenceStatus | None,
    serial_state: SerialState | None,
    serial_number: str | None,
    pnr_status: PnrStatus | None,
    communications_status: CommunicationsStatus | None,
    actual_condition: str | None,
    completeness_status: str | None,
    comment_text: str | None,
) -> EquipmentInstance:
    instance = session.scalar(
        select(EquipmentInstance).where(EquipmentInstance.planned_item_id == planned_item_id)
    )
    if instance is None:
        raise ValueError("Equipment instance not found")

    now = datetime.now(timezone.utc)

    event = DomainEvent(
        event_uid=str(uuid.uuid4()),
        event_type="item.operator_corrected",
        aggregate_type="equipment_instance",
        aggregate_id=instance.id,
        user_id=changed_by,
        device_id=None,
        sync_batch_id=None,
        occurred_at_device=None,
        recorded_at_server=now,
        payload_json={
            "planned_item_id": planned_item_id,
            "presence_status": presence_status.value if presence_status else None,
            "serial_state": serial_state.value if serial_state else None,
            "serial_number": serial_number,
            "pnr_status": pnr_status.value if pnr_status else None,
            "communications_status": communications_status.value if communications_status else None,
            "actual_condition": actual_condition,
            "completeness_status": completeness_status,
            "comment_text": comment_text,
        },
        metadata_json={"source": "operator"},
    )
    session.add(event)
    session.flush()

    if presence_status is not None:
        instance.current_presence_status = presence_status
        session.add(
            ItemStatusHistory(
                equipment_instance_id=instance.id,
                status_code=presence_status,
                comment_text=comment_text,
                changed_by=changed_by,
                changed_at_device=None,
                changed_at_server=now,
                source_event_id=event.id,
            )
        )

    if serial_state is not None:
        instance.serial_state = serial_state
        instance.serial_number = serial_number if serial_state == SerialState.SERIAL_ENTERED else None

    if pnr_status is not None:
        instance.pnr_status = pnr_status
        session.add(
            PnrHistory(
                equipment_instance_id=instance.id,
                pnr_status=pnr_status,
                comment_text=comment_text,
                changed_by=changed_by,
                changed_at_device=None,
                changed_at_server=now,
                source_event_id=event.id,
            )
        )

    if communications_status is not None:
        instance.communications_status = communications_status
        session.add(
            CommunicationHistory(
                equipment_instance_id=instance.id,
                communications_status=communications_status,
                comment_text=comment_text,
                changed_by=changed_by,
                changed_at_device=None,
                changed_at_server=now,
                source_event_id=event.id,
            )
        )

    if actual_condition is not None:
        instance.actual_condition = actual_condition
    if completeness_status is not None:
        instance.completeness_status = completeness_status

    instance.last_check_at = now
    instance.last_checked_by = changed_by
    instance.last_event_id = event.id
    instance.version_no += 1

    session.add(
        ItemCheck(
            equipment_instance_id=instance.id,
            planned_item_id=instance.planned_item_id,
            room_id=instance.current_room_id,
            check_type=CheckType.OPERATOR_CORRECTION,
            presence_status=instance.current_presence_status,
            serial_number=instance.serial_number,
            serial_state=instance.serial_state,
            pnr_status=instance.pnr_status,
            communications_status=instance.communications_status,
            actual_condition=instance.actual_condition,
            completeness_status=instance.completeness_status,
            comment_text=comment_text,
            created_by=changed_by,
            device_id=None,
            created_at_device=now,
            received_at_server=now,
            sync_batch_id=None,
            is_repeat_check=False,
            repeat_check_id=None,
            source_event_id=event.id,
        )
    )

    session.flush()
    return instance
