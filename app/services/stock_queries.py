from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import ReceiptStatus
from app.models.org import Building, Room, User
from app.models.stock import StockBalance, StockMovement, StorageZone, WarehouseReceipt, WarehouseReceiptItem


def get_stock_overview(db: Session) -> dict:
    storage_zones_count = db.scalar(select(func.count(StorageZone.id))) or 0
    active_storage_zones_count = db.scalar(select(func.count(StorageZone.id)).where(StorageZone.is_active.is_(True))) or 0
    receipts_count = db.scalar(select(func.count(WarehouseReceipt.id))) or 0
    pending_receipts_count = db.scalar(
        select(func.count(WarehouseReceipt.id)).where(
            WarehouseReceipt.status_code.in_(
                [
                    ReceiptStatus.DRAFT,
                    ReceiptStatus.AWAITING_CONFIRMATION,
                    ReceiptStatus.PARTIALLY_CONFIRMED,
                ],
            ),
        ),
    ) or 0
    movements_count = db.scalar(select(func.count(StockMovement.id))) or 0
    quantity_on_hand = db.scalar(select(func.coalesce(func.sum(StockBalance.quantity_on_hand), 0))) or 0

    return {
        "storage_zones_count": int(storage_zones_count),
        "active_storage_zones_count": int(active_storage_zones_count),
        "receipts_count": int(receipts_count),
        "pending_receipts_count": int(pending_receipts_count),
        "movements_count": int(movements_count),
        "quantity_on_hand": int(quantity_on_hand),
    }


def list_storage_zones(db: Session) -> list[dict]:
    balance_subquery = (
        select(
            StockBalance.storage_zone_id.label("storage_zone_id"),
            func.coalesce(func.sum(StockBalance.quantity_on_hand), 0).label("quantity_on_hand"),
        )
        .group_by(StockBalance.storage_zone_id)
        .subquery()
    )

    movement_subquery = (
        select(
            StorageZone.id.label("storage_zone_id"),
            func.count(StockMovement.id).label("movements_count"),
        )
        .select_from(StorageZone)
        .outerjoin(
            StockMovement,
            or_(
                StockMovement.from_storage_zone_id == StorageZone.id,
                StockMovement.to_storage_zone_id == StorageZone.id,
            ),
        )
        .group_by(StorageZone.id)
        .subquery()
    )

    rows = db.execute(
        select(
            StorageZone.id,
            StorageZone.code,
            StorageZone.name,
            StorageZone.room_id,
            Room.room_code,
            Room.room_name,
            StorageZone.is_active,
            StorageZone.opened_at,
            func.coalesce(balance_subquery.c.quantity_on_hand, 0),
            func.coalesce(movement_subquery.c.movements_count, 0),
        )
        .outerjoin(Room, Room.id == StorageZone.room_id)
        .outerjoin(balance_subquery, balance_subquery.c.storage_zone_id == StorageZone.id)
        .outerjoin(movement_subquery, movement_subquery.c.storage_zone_id == StorageZone.id)
        .order_by(StorageZone.is_active.desc(), StorageZone.name.asc()),
    ).all()

    return [
        {
            "storage_zone_id": str(row[0]),
            "code": row[1],
            "name": row[2],
            "room_id": str(row[3]) if row[3] else None,
            "room_code": row[4],
            "room_name": row[5],
            "is_active": bool(row[6]),
            "opened_at": row[7],
            "quantity_on_hand": int(row[8] or 0),
            "movements_count": int(row[9] or 0),
        }
        for row in rows
    ]


def list_receipts(db: Session) -> list[dict]:
    rows = db.execute(
        select(
            WarehouseReceipt.id,
            WarehouseReceipt.receipt_no,
            WarehouseReceipt.target_storage_zone_id,
            StorageZone.name,
            WarehouseReceipt.status_code,
            WarehouseReceipt.created_at,
            WarehouseReceipt.confirmed_at,
            User.full_name,
            func.count(WarehouseReceiptItem.id),
            func.coalesce(func.sum(WarehouseReceiptItem.declared_quantity), 0),
            func.coalesce(func.sum(WarehouseReceiptItem.actual_quantity), 0),
        )
        .join(StorageZone, StorageZone.id == WarehouseReceipt.target_storage_zone_id)
        .join(User, User.id == WarehouseReceipt.created_by)
        .outerjoin(WarehouseReceiptItem, WarehouseReceiptItem.warehouse_receipt_id == WarehouseReceipt.id)
        .group_by(
            WarehouseReceipt.id,
            StorageZone.name,
            User.full_name,
        )
        .order_by(WarehouseReceipt.created_at.desc())
        .limit(100),
    ).all()

    return [
        {
            "warehouse_receipt_id": str(row[0]),
            "receipt_no": row[1],
            "target_storage_zone_id": str(row[2]),
            "target_storage_zone_name": row[3],
            "status_code": row[4].value if hasattr(row[4], "value") else str(row[4]),
            "created_at": row[5],
            "confirmed_at": row[6],
            "created_by_name": row[7],
            "items_count": int(row[8] or 0),
            "total_declared_quantity": int(row[9] or 0),
            "total_actual_quantity": int(row[10] or 0),
        }
        for row in rows
    ]


def get_default_building_id(db: Session) -> str | None:
    building_id = db.scalar(
        select(Building.id)
        .where(Building.is_active.is_(True))
        .order_by(Building.created_at.asc())
        .limit(1),
    )
    return str(building_id) if building_id else None

