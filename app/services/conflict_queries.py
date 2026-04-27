from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, aliased

from app.models.inventory import Conflict, EquipmentInstance
from app.models.org import Room, User
from app.models.plan import PlannedItem, PlannedPosition
from app.models.stock import StorageZone, WarehouseReceiptItem
from app.models.sync import DomainEvent


def get_conflicts_summary(db: Session) -> dict:
    row = db.execute(
        select(
            func.count(Conflict.id),
            func.coalesce(func.sum(case((Conflict.status_code == "open", 1), else_=0)), 0),
            func.coalesce(func.sum(case((Conflict.status_code == "resolved", 1), else_=0)), 0),
            func.coalesce(func.sum(case((Conflict.status_code == "dismissed", 1), else_=0)), 0),
        )
    ).one()

    return {
        "total": int(row[0] or 0),
        "open": int(row[1] or 0),
        "resolved": int(row[2] or 0),
        "dismissed": int(row[3] or 0),
    }


def list_conflicts(db: Session, status_code: str | None = None, conflict_type: str | None = None) -> list[dict]:
    first_event = aliased(DomainEvent)
    second_event = aliased(DomainEvent)
    first_user = aliased(User)
    second_user = aliased(User)

    stmt = (
        select(
            Conflict.id,
            Conflict.conflict_type,
            Conflict.status_code,
            Conflict.detected_at,
            Conflict.resolved_at,
            Conflict.room_id,
            Room.room_code,
            Room.room_name,
            Conflict.equipment_instance_id,
            Conflict.planned_position_id,
            Conflict.warehouse_receipt_id,
            Conflict.warehouse_receipt_item_id,
            Conflict.storage_zone_id,
            StorageZone.name,
            EquipmentInstance.planned_item_id,
            PlannedItem.display_label,
            func.coalesce(PlannedPosition.equipment_name, WarehouseReceiptItem.equipment_name),
            WarehouseReceiptItem.position_code,
            first_event.event_type,
            second_event.event_type,
            first_user.full_name,
            second_user.full_name,
            Conflict.resolution_note,
        )
        .outerjoin(Room, Room.id == Conflict.room_id)
        .outerjoin(EquipmentInstance, EquipmentInstance.id == Conflict.equipment_instance_id)
        .outerjoin(PlannedItem, PlannedItem.id == EquipmentInstance.planned_item_id)
        .outerjoin(
            PlannedPosition,
            (PlannedPosition.id == PlannedItem.planned_position_id)
            | (PlannedPosition.id == Conflict.planned_position_id),
        )
        .outerjoin(WarehouseReceiptItem, WarehouseReceiptItem.id == Conflict.warehouse_receipt_item_id)
        .outerjoin(StorageZone, StorageZone.id == Conflict.storage_zone_id)
        .outerjoin(first_event, first_event.id == Conflict.first_event_id)
        .outerjoin(second_event, second_event.id == Conflict.second_event_id)
        .outerjoin(first_user, first_user.id == first_event.user_id)
        .outerjoin(second_user, second_user.id == second_event.user_id)
        .order_by(Conflict.detected_at.desc())
    )

    if status_code:
        stmt = stmt.where(Conflict.status_code == status_code)
    if conflict_type:
        stmt = stmt.where(Conflict.conflict_type == conflict_type)

    rows = db.execute(stmt).all()
    return [
        {
            "conflict_id": str(row[0]),
            "conflict_type": row[1].value if hasattr(row[1], "value") else str(row[1]),
            "status_code": row[2].value if hasattr(row[2], "value") else str(row[2]),
            "detected_at": row[3],
            "resolved_at": row[4],
            "room_id": str(row[5]) if row[5] else None,
            "room_code": row[6],
            "room_name": row[7],
            "equipment_instance_id": str(row[8]) if row[8] else None,
            "planned_position_id": str(row[9]) if row[9] else None,
            "warehouse_receipt_id": str(row[10]) if row[10] else None,
            "warehouse_receipt_item_id": str(row[11]) if row[11] else None,
            "storage_zone_id": str(row[12]) if row[12] else None,
            "storage_zone_name": row[13],
            "planned_item_id": str(row[14]) if row[14] else None,
            "display_label": row[15],
            "equipment_name": row[16],
            "position_code": row[17],
            "first_event_type": row[18],
            "second_event_type": row[19],
            "first_user_name": row[20],
            "second_user_name": row[21],
            "resolution_note": row[22],
        }
        for row in rows
    ]
