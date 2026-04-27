from sqlalchemy import case, cast, func, or_, select, String
from sqlalchemy.orm import Session

from app.models.enums import ConflictStatus, FollowUpTaskStatus, ReceiptItemStatus, ReceiptStatus, StorageZoneType
from app.models.inventory import Conflict
from app.models.org import Building, Room, User
from app.models.plan import PlannedPosition
from app.models.stock import (
    ReceiptFollowUpTask,
    StockBalance,
    StockMovement,
    StorageZone,
    WarehouseReceipt,
    WarehouseReceiptItem,
)


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
            StorageZone.zone_type,
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
            "zone_type": row[3].value if hasattr(row[3], "value") else str(row[3]),
            "room_id": str(row[4]) if row[4] else None,
            "room_code": row[5],
            "room_name": row[6],
            "is_active": bool(row[7]),
            "opened_at": row[8],
            "quantity_on_hand": int(row[9] or 0),
            "movements_count": int(row[10] or 0),
        }
        for row in rows
    ]


def list_receipts(db: Session) -> list[dict]:
    issue_subquery = (
        select(
            WarehouseReceiptItem.warehouse_receipt_id.label("warehouse_receipt_id"),
            func.count(WarehouseReceiptItem.id).label("issues_count"),
        )
        .where(
            WarehouseReceiptItem.status_code.in_(
                [
                    ReceiptItemStatus.SHORTAGE,
                    ReceiptItemStatus.SURPLUS,
                    ReceiptItemStatus.UNPLANNED,
                ],
            )
        )
        .group_by(WarehouseReceiptItem.warehouse_receipt_id)
        .subquery()
    )

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
            func.coalesce(issue_subquery.c.issues_count, 0),
        )
        .join(StorageZone, StorageZone.id == WarehouseReceipt.target_storage_zone_id)
        .join(User, User.id == WarehouseReceipt.created_by)
        .outerjoin(WarehouseReceiptItem, WarehouseReceiptItem.warehouse_receipt_id == WarehouseReceipt.id)
        .outerjoin(issue_subquery, issue_subquery.c.warehouse_receipt_id == WarehouseReceipt.id)
        .group_by(
            WarehouseReceipt.id,
            StorageZone.name,
            User.full_name,
            issue_subquery.c.issues_count,
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
            "issues_count": int(row[11] or 0),
        }
        for row in rows
    ]


def get_receipt_detail(db: Session, receipt_id: str) -> dict | None:
    receipt_row = db.execute(
        select(
            WarehouseReceipt.id,
            WarehouseReceipt.receipt_no,
            WarehouseReceipt.building_id,
            WarehouseReceipt.target_storage_zone_id,
            StorageZone.name,
            WarehouseReceipt.status_code,
            WarehouseReceipt.created_at,
            WarehouseReceipt.confirmed_at,
            User.full_name,
            WarehouseReceipt.comment_text,
        )
        .join(StorageZone, StorageZone.id == WarehouseReceipt.target_storage_zone_id)
        .join(User, User.id == WarehouseReceipt.created_by)
        .where(WarehouseReceipt.id == receipt_id)
    ).one_or_none()
    if receipt_row is None:
        return None

    item_rows = db.execute(
        select(
            WarehouseReceiptItem.id,
            WarehouseReceiptItem.position_code,
            WarehouseReceiptItem.planned_position_id,
            WarehouseReceiptItem.equipment_name,
            WarehouseReceiptItem.model_mark,
            WarehouseReceiptItem.category_id,
            WarehouseReceiptItem.declared_quantity,
            WarehouseReceiptItem.actual_quantity,
            WarehouseReceiptItem.condition_status,
            WarehouseReceiptItem.completeness_status,
            WarehouseReceiptItem.status_code,
            WarehouseReceiptItem.placement_status,
            WarehouseReceiptItem.photo_refs_json,
            WarehouseReceiptItem.comment_text,
            WarehouseReceiptItem.created_at,
        )
        .where(WarehouseReceiptItem.warehouse_receipt_id == receipt_id)
        .order_by(WarehouseReceiptItem.created_at.asc(), WarehouseReceiptItem.position_code.asc()),
    ).all()

    return {
        "warehouse_receipt_id": str(receipt_row[0]),
        "receipt_no": receipt_row[1],
        "building_id": str(receipt_row[2]),
        "target_storage_zone_id": str(receipt_row[3]),
        "target_storage_zone_name": receipt_row[4],
        "status_code": receipt_row[5].value if hasattr(receipt_row[5], "value") else str(receipt_row[5]),
        "created_at": receipt_row[6],
        "confirmed_at": receipt_row[7],
        "created_by_name": receipt_row[8],
        "comment_text": receipt_row[9],
        "items": [
            {
                "warehouse_receipt_item_id": str(item[0]),
                "position_code": item[1],
                "planned_position_id": str(item[2]) if item[2] else None,
                "equipment_name": item[3],
                "model_mark": item[4],
                "category_id": str(item[5]) if item[5] else None,
                "declared_quantity": int(item[6]),
                "actual_quantity": int(item[7]),
                "condition_status": item[8].value if hasattr(item[8], "value") else item[8],
                "completeness_status": item[9],
                "status_code": item[10].value if hasattr(item[10], "value") else str(item[10]),
                "placement_status": item[11].value if hasattr(item[11], "value") else str(item[11]),
                "photo_refs": list(item[12] or []),
                "comment_text": item[13],
                "created_at": item[14],
            }
            for item in item_rows
        ],
    }


def list_receipt_issues(db: Session, receipt_id: str) -> list[dict]:
    task_subquery = (
        select(
            ReceiptFollowUpTask.warehouse_receipt_item_id.label("warehouse_receipt_item_id"),
            func.max(cast(ReceiptFollowUpTask.id, String)).label("follow_up_task_id"),
            func.max(cast(ReceiptFollowUpTask.status_code, String)).label("task_status_code"),
        )
        .where(ReceiptFollowUpTask.status_code != FollowUpTaskStatus.CANCELLED)
        .group_by(ReceiptFollowUpTask.warehouse_receipt_item_id)
        .subquery()
    )

    conflict_subquery = (
        select(
            Conflict.warehouse_receipt_item_id.label("warehouse_receipt_item_id"),
            func.max(cast(Conflict.id, String)).label("conflict_id"),
            func.max(cast(Conflict.status_code, String)).label("conflict_status_code"),
        )
        .group_by(Conflict.warehouse_receipt_item_id)
        .subquery()
    )

    rows = db.execute(
        select(
            WarehouseReceiptItem.id,
            WarehouseReceiptItem.status_code,
            WarehouseReceiptItem.position_code,
            WarehouseReceiptItem.equipment_name,
            WarehouseReceiptItem.declared_quantity,
            WarehouseReceiptItem.actual_quantity,
            StorageZone.id,
            StorageZone.name,
            conflict_subquery.c.conflict_id,
            conflict_subquery.c.conflict_status_code,
            task_subquery.c.follow_up_task_id,
            task_subquery.c.task_status_code,
        )
        .join(WarehouseReceipt, WarehouseReceipt.id == WarehouseReceiptItem.warehouse_receipt_id)
        .join(StorageZone, StorageZone.id == WarehouseReceipt.target_storage_zone_id)
        .outerjoin(
            conflict_subquery,
            conflict_subquery.c.warehouse_receipt_item_id == WarehouseReceiptItem.id,
        )
        .outerjoin(task_subquery, task_subquery.c.warehouse_receipt_item_id == WarehouseReceiptItem.id)
        .where(
            WarehouseReceiptItem.warehouse_receipt_id == receipt_id,
            WarehouseReceiptItem.status_code.in_(
                [
                    ReceiptItemStatus.SHORTAGE,
                    ReceiptItemStatus.SURPLUS,
                    ReceiptItemStatus.UNPLANNED,
                ],
            ),
        )
        .order_by(WarehouseReceiptItem.created_at.asc(), WarehouseReceiptItem.position_code.asc()),
    ).all()

    return [
        {
            "issue_id": str(row[0]),
            "issue_type": row[1].value if hasattr(row[1], "value") else str(row[1]),
            "warehouse_receipt_item_id": str(row[0]),
            "position_code": row[2],
            "equipment_name": row[3],
            "declared_quantity": int(row[4] or 0),
            "actual_quantity": int(row[5] or 0),
            "delta_quantity": int((row[5] or 0) - (row[4] or 0)),
            "storage_zone_id": str(row[6]) if row[6] else None,
            "storage_zone_name": row[7],
            "conflict_id": str(row[8]) if row[8] else None,
            "follow_up_task_id": str(row[10]) if row[10] else None,
            "status_code": (
                row[11].value
                if hasattr(row[11], "value")
                else (
                    str(row[11])
                    if row[11]
                    else (
                        row[9].value
                        if hasattr(row[9], "value")
                        else (str(row[9]) if row[9] else "open")
                    )
                )
            ),
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


def get_default_planned_position(db: Session, building_id: str, position_code: str) -> dict | None:
    row = db.execute(
        select(
            PlannedPosition.id,
            PlannedPosition.equipment_name,
            PlannedPosition.model_mark,
            PlannedPosition.category_id,
        )
        .where(
            PlannedPosition.building_id == building_id,
            PlannedPosition.position_code == position_code,
        )
        .order_by(PlannedPosition.created_at.asc())
        .limit(1),
    ).one_or_none()
    if row is None:
        return None
    return {
        "planned_position_id": str(row[0]),
        "equipment_name": row[1],
        "model_mark": row[2],
        "category_id": str(row[3]) if row[3] else None,
    }
