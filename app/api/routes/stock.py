from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.stock import (
    StockOverviewResponse,
    StorageZoneCreateRequest,
    StorageZoneListItem,
    WarehouseReceiptConfirmRequest,
    WarehouseReceiptCreateRequest,
    WarehouseReceiptDetailResponse,
    WarehouseReceiptIssueItem,
    WarehouseReceiptIssueResolveRequest,
    WarehouseReceiptIssueResolveResponse,
    WarehouseReceiptListItem,
)
from app.services.stock_actions import create_storage_zone, create_warehouse_receipt, confirm_warehouse_receipt, resolve_receipt_issue
from app.services.stock_queries import get_receipt_detail, get_stock_overview, list_receipt_issues, list_receipts, list_storage_zones
from app.services.system_user import get_or_create_system_user


router = APIRouter()


@router.get("/overview", response_model=StockOverviewResponse)
def stock_overview(db: Session = Depends(get_db)) -> StockOverviewResponse:
    return StockOverviewResponse(**get_stock_overview(db))


@router.get("/receipts", response_model=list[WarehouseReceiptListItem])
def receipts_list(db: Session = Depends(get_db)) -> list[WarehouseReceiptListItem]:
    return [WarehouseReceiptListItem(**row) for row in list_receipts(db)]


@router.post("/receipts", response_model=WarehouseReceiptDetailResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(payload: WarehouseReceiptCreateRequest, db: Session = Depends(get_db)) -> WarehouseReceiptDetailResponse:
    system_user = get_or_create_system_user(db)
    try:
        receipt = create_warehouse_receipt(
            db,
            receipt_no=payload.receipt_no,
            building_id=payload.building_id,
            target_storage_zone_id=payload.target_storage_zone_id,
            comment_text=payload.comment_text,
            items=[item.model_dump() for item in payload.items],
            created_by=system_user.id,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    receipt_payload = get_receipt_detail(db, str(receipt.id))
    if receipt_payload is None:
        raise HTTPException(status_code=500, detail="Created warehouse receipt not found.")
    return WarehouseReceiptDetailResponse(**receipt_payload)


@router.get("/receipts/{receipt_id}", response_model=WarehouseReceiptDetailResponse)
def receipt_detail(receipt_id: str, db: Session = Depends(get_db)) -> WarehouseReceiptDetailResponse:
    payload = get_receipt_detail(db, receipt_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Warehouse receipt not found.")
    return WarehouseReceiptDetailResponse(**payload)


@router.post("/receipts/{receipt_id}/confirm", response_model=WarehouseReceiptDetailResponse)
def confirm_receipt(
    receipt_id: str,
    payload: WarehouseReceiptConfirmRequest,
    db: Session = Depends(get_db),
) -> WarehouseReceiptDetailResponse:
    system_user = get_or_create_system_user(db)
    try:
        confirm_warehouse_receipt(
            db,
            receipt_id=receipt_id,
            confirmed_by=system_user.id,
            comment_text=payload.comment_text,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    receipt_payload = get_receipt_detail(db, receipt_id)
    if receipt_payload is None:
        raise HTTPException(status_code=404, detail="Warehouse receipt not found.")
    return WarehouseReceiptDetailResponse(**receipt_payload)


@router.get("/receipts/{receipt_id}/issues", response_model=list[WarehouseReceiptIssueItem])
def receipt_issues(receipt_id: str, db: Session = Depends(get_db)) -> list[WarehouseReceiptIssueItem]:
    return [WarehouseReceiptIssueItem(**row) for row in list_receipt_issues(db, receipt_id)]


@router.post("/receipts/{receipt_id}/issues/{issue_id}/resolve", response_model=WarehouseReceiptIssueResolveResponse)
def resolve_issue(
    receipt_id: str,
    issue_id: str,
    payload: WarehouseReceiptIssueResolveRequest,
    db: Session = Depends(get_db),
) -> WarehouseReceiptIssueResolveResponse:
    system_user = get_or_create_system_user(db)
    try:
        result = resolve_receipt_issue(
            db,
            receipt_id=receipt_id,
            issue_id=issue_id,
            action=payload.action,
            resolved_by=system_user.id,
            comment_text=payload.comment_text,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return WarehouseReceiptIssueResolveResponse(**result)


@router.get("/zones", response_model=list[StorageZoneListItem])
def storage_zones_list(db: Session = Depends(get_db)) -> list[StorageZoneListItem]:
    return [StorageZoneListItem(**row) for row in list_storage_zones(db)]


@router.post("/zones", response_model=StorageZoneListItem, status_code=status.HTTP_201_CREATED)
def create_zone(payload: StorageZoneCreateRequest, db: Session = Depends(get_db)) -> StorageZoneListItem:
    system_user = get_or_create_system_user(db)
    try:
        zone = create_storage_zone(
            db,
            code=payload.code,
            name=payload.name,
            room_id=payload.room_id,
            created_by=system_user.id,
        )
        db.commit()
        zone_payload = next(
            (item for item in list_storage_zones(db) if item["storage_zone_id"] == str(zone.id)),
            None,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if zone_payload is None:
        raise HTTPException(status_code=500, detail="Created storage zone not found.")
    return StorageZoneListItem(**zone_payload)
