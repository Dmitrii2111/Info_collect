from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import CommunicationsStatus, ItemPresenceStatus, PnrStatus, SerialState
from app.schemas.field import (
    FieldAssignmentsResponse,
    FieldBootstrapResponse,
    FieldItemCheckRequest,
    FieldItemCheckResponse,
    RoomCompletionRequest,
    RoomCompletionResponse,
)
from app.schemas.users import FieldLoginRequest, FieldLoginResponse
from app.services.field_actions import build_field_bootstrap, complete_room_check, list_field_assignments, submit_field_item_check
from app.services.user_admin import create_field_login_payload


router = APIRouter()


@router.post("/login", response_model=FieldLoginResponse)
def field_login(payload: FieldLoginRequest, db: Session = Depends(get_db)) -> FieldLoginResponse:
    try:
        result = create_field_login_payload(
            db,
            login=payload.login,
            password=payload.password,
            device_uid=payload.device_uid,
            platform=payload.platform,
            app_version=payload.app_version,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FieldLoginResponse(**result)


@router.get("/assignments", response_model=FieldAssignmentsResponse)
def get_assignments(
    worker_login: str,
    worker_full_name: str | None = None,
    plan_version_id: str | None = None,
    db: Session = Depends(get_db),
) -> FieldAssignmentsResponse:
    payload = list_field_assignments(
        db,
        worker_login=worker_login,
        worker_full_name=worker_full_name,
        plan_version_id=plan_version_id,
    )
    db.commit()
    return FieldAssignmentsResponse(**payload)


@router.get("/bootstrap", response_model=FieldBootstrapResponse)
def get_bootstrap(
    worker_login: str,
    device_uid: str,
    platform: str,
    worker_full_name: str | None = None,
    app_version: str | None = None,
    plan_version_id: str | None = None,
    db: Session = Depends(get_db),
) -> FieldBootstrapResponse:
    payload = build_field_bootstrap(
        db,
        worker_login=worker_login,
        worker_full_name=worker_full_name,
        device_uid=device_uid,
        platform=platform,
        app_version=app_version,
        plan_version_id=plan_version_id,
    )
    db.commit()
    return FieldBootstrapResponse(**payload)


@router.post("/checks", response_model=FieldItemCheckResponse)
def submit_check(payload: FieldItemCheckRequest, db: Session = Depends(get_db)) -> FieldItemCheckResponse:
    try:
        presence_status = ItemPresenceStatus(payload.presence_status)
        serial_state = SerialState(payload.serial_state)
        pnr_status = PnrStatus(payload.pnr_status)
        communications_status = CommunicationsStatus(payload.communications_status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        instance, user, device, conflict_created = submit_field_item_check(
            db,
            worker_login=payload.worker_login,
            worker_full_name=payload.worker_full_name,
            planned_item_id=payload.planned_item_id,
            device_uid=payload.device_uid,
            platform=payload.platform,
            app_version=payload.app_version,
            presence_status=presence_status,
            serial_state=serial_state,
            serial_number=payload.serial_number,
            pnr_status=pnr_status,
            communications_status=communications_status,
            actual_condition=payload.actual_condition,
            completeness_status=payload.completeness_status,
            comment_text=payload.comment_text,
            created_at_device=payload.created_at_device,
            event_uid=payload.event_uid,
            is_repeat_check=payload.is_repeat_check,
            repeat_check_id=payload.repeat_check_id,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Field check failed: {exc}") from exc

    return FieldItemCheckResponse(
        message="Field check saved",
        equipment_instance_id=str(instance.id),
        planned_item_id=str(instance.planned_item_id),
        checked_by=user.full_name,
        device_id=str(device.id),
        conflict_created=conflict_created,
    )


@router.post("/rooms/{room_id}/complete", response_model=RoomCompletionResponse)
def complete_room(room_id: str, payload: RoomCompletionRequest, db: Session = Depends(get_db)) -> RoomCompletionResponse:
    try:
        room, user, device, recorded_at = complete_room_check(
            db,
            room_id=room_id,
            worker_login=payload.worker_login,
            worker_full_name=payload.worker_full_name,
            device_uid=payload.device_uid,
            platform=payload.platform,
            app_version=payload.app_version,
            comment_text=payload.comment_text,
            created_at_device=payload.created_at_device,
            event_uid=payload.event_uid,
            checked_items_count=payload.checked_items_count,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Room completion failed: {exc}") from exc

    return RoomCompletionResponse(
        message="Room check completed",
        room_id=str(room.id),
        room_code=room.room_code,
        completed_by=user.full_name,
        device_id=str(device.id),
        recorded_at=recorded_at,
    )
