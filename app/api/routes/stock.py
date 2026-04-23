from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.stock import (
    StockOverviewResponse,
    StorageZoneCreateRequest,
    StorageZoneListItem,
    WarehouseReceiptListItem,
)
from app.services.stock_actions import create_storage_zone
from app.services.stock_queries import get_stock_overview, list_receipts, list_storage_zones
from app.services.system_user import get_or_create_system_user


router = APIRouter()


@router.get("/overview", response_model=StockOverviewResponse)
def stock_overview(db: Session = Depends(get_db)) -> StockOverviewResponse:
    return StockOverviewResponse(**get_stock_overview(db))


@router.get("/receipts", response_model=list[WarehouseReceiptListItem])
def receipts_list(db: Session = Depends(get_db)) -> list[WarehouseReceiptListItem]:
    return [WarehouseReceiptListItem(**row) for row in list_receipts(db)]


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
