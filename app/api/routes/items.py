from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import CommunicationsStatus, ItemPresenceStatus, PnrStatus, SerialState
from app.schemas.items import (
    EquipmentItemDetail,
    EquipmentItemListItem,
    EquipmentItemListResponse,
    EquipmentItemSummaryResponse,
    EquipmentItemUpdateRequest,
    EquipmentItemUpdateResponse,
)
from app.services.item_actions import update_item_by_operator
from app.services.item_queries import get_item_detail, get_items_summary, list_items
from app.services.system_user import get_or_create_system_user


router = APIRouter()


@router.get("", response_model=EquipmentItemListResponse)
def items_list(
    plan_version_id: str | None = None,
    room_id: str | None = None,
    room_code: str | None = None,
    presence_status: str | None = None,
    serial_state: str | None = None,
    pnr_status: str | None = None,
    communications_status: str | None = None,
    worklist_filter: str | None = None,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> EquipmentItemListResponse:
    payload = list_items(
        db,
        plan_version_id=plan_version_id,
        room_id=room_id,
        room_code=room_code,
        presence_status=presence_status,
        serial_state=serial_state,
        pnr_status=pnr_status,
        communications_status=communications_status,
        worklist_filter=worklist_filter,
        q=q,
        limit=limit,
        offset=offset,
    )
    return EquipmentItemListResponse(
        total=payload["total"],
        items=[EquipmentItemListItem(**item) for item in payload["items"]],
    )


@router.get("/summary", response_model=EquipmentItemSummaryResponse)
def items_summary(
    plan_version_id: str | None = None,
    room_id: str | None = None,
    room_code: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
) -> EquipmentItemSummaryResponse:
    payload = get_items_summary(
        db,
        plan_version_id=plan_version_id,
        room_id=room_id,
        room_code=room_code,
        q=q,
    )
    return EquipmentItemSummaryResponse(**payload)


@router.get("/{planned_item_id}", response_model=EquipmentItemDetail)
def item_detail(planned_item_id: str, db: Session = Depends(get_db)) -> EquipmentItemDetail:
    payload = get_item_detail(db, planned_item_id)
    if payload is None:
        raise HTTPException(status_code=404, detail=f"Item not found: {planned_item_id}")
    return EquipmentItemDetail(**payload)


@router.patch("/{planned_item_id}", response_model=EquipmentItemUpdateResponse)
def update_item(planned_item_id: str, payload: EquipmentItemUpdateRequest, db: Session = Depends(get_db)) -> EquipmentItemUpdateResponse:
    operator = get_or_create_system_user(db)

    try:
        presence_status = ItemPresenceStatus(payload.presence_status) if payload.presence_status is not None else None
        serial_state = SerialState(payload.serial_state) if payload.serial_state is not None else None
        pnr_status = PnrStatus(payload.pnr_status) if payload.pnr_status is not None else None
        communications_status = (
            CommunicationsStatus(payload.communications_status)
            if payload.communications_status is not None
            else None
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        instance = update_item_by_operator(
            db,
            planned_item_id=planned_item_id,
            changed_by=operator.id,
            presence_status=presence_status,
            serial_state=serial_state,
            serial_number=payload.serial_number,
            pnr_status=pnr_status,
            communications_status=communications_status,
            actual_condition=payload.actual_condition,
            completeness_status=payload.completeness_status,
            comment_text=payload.comment_text,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Item update failed: {exc}") from exc

    return EquipmentItemUpdateResponse(
        message="Item updated",
        equipment_instance_id=str(instance.id),
        planned_item_id=str(instance.planned_item_id),
    )
