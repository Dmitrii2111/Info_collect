from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import CommunicationsStatus, ItemPresenceStatus, PnrStatus, SerialState, SyncBatchStatus
from app.models.sync import DomainEvent, SyncBatch
from app.schemas.sync import SyncBatchRequest
from app.services.field_actions import complete_room_check, get_or_create_device, get_or_create_field_user, submit_field_item_check


def process_sync_batch(session: Session, payload: SyncBatchRequest) -> dict:
    worker = get_or_create_field_user(session, payload.worker_login, payload.worker_full_name)
    device = get_or_create_device(
        session,
        user_id=worker.id,
        device_uid=payload.device_uid,
        platform=payload.platform,
        app_version=payload.app_version,
    )

    batch = session.scalar(select(SyncBatch).where(SyncBatch.batch_uid == payload.batch_uid))
    if batch is None:
        batch = SyncBatch(
            device_id=device.id,
            user_id=worker.id,
            batch_uid=payload.batch_uid,
            sent_at_device=payload.sent_at_device,
            items_count=len(payload.items),
            status_code=SyncBatchStatus.RECEIVED,
            error_text=None,
        )
        session.add(batch)
        session.flush()

    results: list[dict] = []
    processed_count = 0
    duplicate_count = 0
    error_count = 0

    for item in payload.items:
        existing_event = session.scalar(select(DomainEvent).where(DomainEvent.event_uid == item.event_uid))
        if existing_event is not None:
            duplicate_count += 1
            results.append(
                {
                    "client_item_id": item.client_item_id,
                    "action_type": item.action_type,
                    "status": "duplicate",
                    "message": "Event already processed",
                    "event_uid": item.event_uid,
                    "aggregate_id": str(existing_event.aggregate_id),
                    "conflict_created": False,
                }
            )
            continue

        try:
            with session.begin_nested():
                if item.action_type == "item_check":
                    if not all(
                        [
                            item.planned_item_id,
                            item.presence_status,
                            item.serial_state,
                            item.pnr_status,
                            item.communications_status,
                        ]
                    ):
                        raise ValueError("Missing required item_check fields")

                    presence_status = ItemPresenceStatus(item.presence_status)
                    serial_state = SerialState(item.serial_state)
                    pnr_status = PnrStatus(item.pnr_status)
                    communications_status = CommunicationsStatus(item.communications_status)

                    instance, _, _, conflict_created = submit_field_item_check(
                        session,
                        worker_login=payload.worker_login,
                        worker_full_name=payload.worker_full_name,
                        planned_item_id=item.planned_item_id,
                        device_uid=payload.device_uid,
                        platform=payload.platform,
                        app_version=payload.app_version,
                        presence_status=presence_status,
                        serial_state=serial_state,
                        serial_number=item.serial_number,
                        pnr_status=pnr_status,
                        communications_status=communications_status,
                        actual_condition=item.actual_condition,
                        completeness_status=item.completeness_status,
                        comment_text=item.comment_text,
                        created_at_device=item.created_at_device,
                        event_uid=item.event_uid,
                        is_repeat_check=item.is_repeat_check,
                        repeat_check_id=item.repeat_check_id,
                        sync_batch_id=batch.id,
                    )
                    aggregate_id = str(instance.id)
                    results.append(
                        {
                            "client_item_id": item.client_item_id,
                            "action_type": item.action_type,
                            "status": "processed",
                            "message": "Item check processed",
                            "event_uid": item.event_uid,
                            "aggregate_id": aggregate_id,
                            "conflict_created": conflict_created,
                        }
                    )
                elif item.action_type == "room_complete":
                    if not item.room_id:
                        raise ValueError("Missing required room_complete fields")

                    room, _, _, _ = complete_room_check(
                        session,
                        room_id=item.room_id,
                        worker_login=payload.worker_login,
                        worker_full_name=payload.worker_full_name,
                        device_uid=payload.device_uid,
                        platform=payload.platform,
                        app_version=payload.app_version,
                        comment_text=item.comment_text,
                        created_at_device=item.created_at_device,
                        event_uid=item.event_uid,
                        checked_items_count=item.checked_items_count,
                        sync_batch_id=batch.id,
                    )
                    aggregate_id = str(room.id)
                    results.append(
                        {
                            "client_item_id": item.client_item_id,
                            "action_type": item.action_type,
                            "status": "processed",
                            "message": "Room completion processed",
                            "event_uid": item.event_uid,
                            "aggregate_id": aggregate_id,
                            "conflict_created": False,
                        }
                    )
                else:
                    raise ValueError(f"Unsupported action_type: {item.action_type}")

            processed_count += 1
        except Exception as exc:
            error_count += 1
            results.append(
                {
                    "client_item_id": item.client_item_id,
                    "action_type": item.action_type,
                    "status": "error",
                    "message": str(exc),
                    "event_uid": item.event_uid,
                    "aggregate_id": None,
                    "conflict_created": False,
                }
            )

    batch.items_count = len(payload.items)
    if error_count > 0:
        batch.status_code = SyncBatchStatus.PROCESSED_WITH_ERRORS
        batch.error_text = f"{error_count} item(s) failed"
    else:
        batch.status_code = SyncBatchStatus.PROCESSED
        batch.error_text = None

    session.flush()

    return {
        "batch_uid": batch.batch_uid,
        "batch_id": str(batch.id),
        "status": batch.status_code.value,
        "items_count": len(payload.items),
        "processed_count": processed_count,
        "duplicate_count": duplicate_count,
        "error_count": error_count,
        "results": results,
    }
