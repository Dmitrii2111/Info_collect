from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.enums import (
    ConditionStatus,
    ConflictStatus,
    ConflictType,
    FollowUpTaskStatus,
    FollowUpTaskType,
    ImportStatus,
    ImportType,
    PlacementStatus,
    ReceiptItemStatus,
    ReceiptStatus,
    StorageZoneType,
)
from app.models.inventory import Conflict
from app.models.org import Room
from app.models.stock import (
    ReceiptFollowUpTask,
    StockBalance,
    StorageZone,
    WarehouseReceipt,
    WarehouseReceiptConfirmation,
    WarehouseReceiptItem,
)
from app.models.sync import DomainEvent, ImportSession
from app.services.stock_queries import get_default_building_id, get_default_planned_position


VIRTUAL_ZONE_PRESETS: dict[StorageZoneType, tuple[str, str]] = {
    StorageZoneType.AWAITING_PLACEMENT: ("SYSTEM-AWAITING", "Ожидает размещения"),
    StorageZoneType.SURPLUS: ("SYSTEM-SURPLUS", "Излишки"),
    StorageZoneType.QUARANTINE: ("SYSTEM-QUARANTINE", "Карантин"),
}


def create_storage_zone(
    db: Session,
    *,
    code: str,
    name: str,
    room_id: str | None,
    created_by: str,
    zone_type: StorageZoneType = StorageZoneType.PHYSICAL,
) -> StorageZone:
    normalized_code = code.strip()
    normalized_name = name.strip()
    if not normalized_code or not normalized_name:
        raise ValueError("Storage zone code and name are required.")

    building_id = None
    if room_id:
        room = db.execute(select(Room).where(Room.id == room_id)).scalar_one_or_none()
        if room is None:
            raise ValueError("Room not found for storage zone.")
        building_id = str(room.building_id)

    if building_id is None:
        building_id = get_default_building_id(db)

    if building_id is None:
        raise ValueError("No active building found for storage zone.")

    existing = db.execute(
        select(StorageZone).where(
            StorageZone.building_id == building_id,
            StorageZone.code == normalized_code,
        ),
    ).scalar_one_or_none()
    if existing is not None:
        raise ValueError("Storage zone with this code already exists.")

    zone = StorageZone(
        building_id=building_id,
        code=normalized_code,
        name=normalized_name,
        zone_type=zone_type,
        room_id=room_id,
        created_by=created_by,
    )
    db.add(zone)
    db.flush()
    return zone


def get_or_create_virtual_storage_zone(
    db: Session,
    *,
    building_id: str,
    zone_type: StorageZoneType,
    created_by: str,
) -> StorageZone:
    if zone_type not in VIRTUAL_ZONE_PRESETS:
        raise ValueError("Unsupported virtual storage zone type.")

    existing = db.execute(
        select(StorageZone).where(
            StorageZone.building_id == building_id,
            StorageZone.zone_type == zone_type,
        ),
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    code, name = VIRTUAL_ZONE_PRESETS[zone_type]
    return create_storage_zone(
        db,
        code=code,
        name=name,
        room_id=None,
        created_by=created_by,
        zone_type=zone_type,
    )


def create_warehouse_receipt(
    db: Session,
    *,
    receipt_no: str | None,
    building_id: str | None,
    target_storage_zone_id: str | None,
    comment_text: str | None,
    items: list[dict],
    created_by: str,
) -> WarehouseReceipt:
    resolved_building_id = building_id or get_default_building_id(db)
    if resolved_building_id is None:
        raise ValueError("No active building found for warehouse receipt.")

    if target_storage_zone_id:
        target_zone = db.execute(select(StorageZone).where(StorageZone.id == target_storage_zone_id)).scalar_one_or_none()
        if target_zone is None:
            raise ValueError("Target storage zone not found.")
        if str(target_zone.building_id) != resolved_building_id:
            raise ValueError("Target storage zone belongs to another building.")
    else:
        target_zone = get_or_create_virtual_storage_zone(
            db,
            building_id=resolved_building_id,
            zone_type=StorageZoneType.AWAITING_PLACEMENT,
            created_by=created_by,
        )

    import_session = ImportSession(
        import_type=ImportType.WAREHOUSE_RECEIPT,
        file_name=receipt_no or f"receipt-{uuid4().hex[:8]}",
        source_path=None,
        status_code=ImportStatus.COMPLETED,
        started_by=created_by,
        started_at=datetime.now(timezone.utc),
        summary_json={"source": "manual_receipt"},
    )
    db.add(import_session)
    db.flush()

    receipt = WarehouseReceipt(
        receipt_no=(receipt_no or "").strip() or None,
        building_id=resolved_building_id,
        target_storage_zone_id=target_zone.id,
        status_code=ReceiptStatus.DRAFT,
        source_import_session_id=import_session.id,
        created_by=created_by,
        comment_text=comment_text,
    )
    db.add(receipt)
    db.flush()

    placement_status = (
        PlacementStatus.AWAITING_PLACEMENT
        if target_zone.zone_type == StorageZoneType.AWAITING_PLACEMENT
        else PlacementStatus.PLACED_TO_STOCK
    )

    for item in items:
        photo_refs = [ref for ref in item.get("photo_refs", []) if str(ref).strip()]
        if not photo_refs:
            raise ValueError(f"Receipt item '{item['position_code']}' requires at least one photo.")

        planned_hint = None
        if not item.get("planned_position_id"):
            planned_hint = get_default_planned_position(db, resolved_building_id, item["position_code"])

        receipt_item = WarehouseReceiptItem(
            warehouse_receipt_id=receipt.id,
            position_code=item["position_code"].strip(),
            planned_position_id=item.get("planned_position_id") or (planned_hint or {}).get("planned_position_id"),
            equipment_name=(item.get("equipment_name") or (planned_hint or {}).get("equipment_name") or "").strip(),
            model_mark=(item.get("model_mark") or (planned_hint or {}).get("model_mark")),
            category_id=item.get("category_id") or (planned_hint or {}).get("category_id"),
            declared_quantity=int(item["declared_quantity"]),
            actual_quantity=int(item["actual_quantity"]),
            condition_status=ConditionStatus(item["condition_status"]),
            completeness_status=item.get("completeness_status"),
            status_code=ReceiptItemStatus.DRAFT,
            placement_status=placement_status,
            photo_refs_json=photo_refs,
            comment_text=item.get("comment_text"),
        )
        if not receipt_item.equipment_name:
            raise ValueError(f"Receipt item '{item['position_code']}' requires equipment name.")
        db.add(receipt_item)

    db.flush()
    return receipt


def confirm_warehouse_receipt(
    db: Session,
    *,
    receipt_id: str,
    confirmed_by: str,
    comment_text: str | None = None,
) -> WarehouseReceipt:
    receipt = db.execute(select(WarehouseReceipt).where(WarehouseReceipt.id == receipt_id)).scalar_one_or_none()
    if receipt is None:
        raise ValueError("Warehouse receipt not found.")
    if receipt.status_code in {ReceiptStatus.CONFIRMED, ReceiptStatus.PARTIALLY_CONFIRMED}:
        raise ValueError("Warehouse receipt is already confirmed.")

    target_zone = db.execute(select(StorageZone).where(StorageZone.id == receipt.target_storage_zone_id)).scalar_one()
    items = db.execute(
        select(WarehouseReceiptItem)
        .where(WarehouseReceiptItem.warehouse_receipt_id == receipt.id)
        .order_by(WarehouseReceiptItem.created_at.asc())
    ).scalars().all()
    if not items:
        raise ValueError("Warehouse receipt does not contain items.")

    surplus_zone = get_or_create_virtual_storage_zone(
        db,
        building_id=str(receipt.building_id),
        zone_type=StorageZoneType.SURPLUS,
        created_by=confirmed_by,
    )

    any_issues = False
    now = datetime.now(timezone.utc)

    for item in items:
        confirmation = WarehouseReceiptConfirmation(
            warehouse_receipt_item_id=item.id,
            confirmed_by=confirmed_by,
            confirmed_quantity=item.actual_quantity,
            condition_status=item.condition_status,
            completeness_status=item.completeness_status,
            comment_text=comment_text or item.comment_text,
            photo_refs_json=item.photo_refs_json,
            created_at_device=now,
            received_at_server=now,
            device_id=None,
        )
        db.add(confirmation)

        confirmed_event = _create_domain_event(
            db,
            event_type="stock.receipt_item_confirmed",
            aggregate_type="warehouse_receipt_item",
            aggregate_id=item.id,
            user_id=confirmed_by,
            payload={
                "warehouse_receipt_id": str(receipt.id),
                "position_code": item.position_code,
                "declared_quantity": item.declared_quantity,
                "actual_quantity": item.actual_quantity,
                "condition_status": item.condition_status.value if item.condition_status else None,
                "photo_refs": list(item.photo_refs_json or []),
                "comment_text": comment_text or item.comment_text,
            },
            metadata={"source": "stock_receipt"},
            occurred_at=now,
        )

        accepted_quantity = min(item.declared_quantity, item.actual_quantity)
        shortage_quantity = max(item.declared_quantity - item.actual_quantity, 0)
        surplus_quantity = max(item.actual_quantity - item.declared_quantity, 0)
        is_unplanned = item.planned_position_id is None

        if accepted_quantity > 0 and not is_unplanned:
            _upsert_stock_balance(
                db,
                storage_zone_id=receipt.target_storage_zone_id,
                planned_position_id=str(item.planned_position_id),
                warehouse_receipt_item_id=str(item.id),
                quantity_delta=accepted_quantity,
            )

        if is_unplanned:
            any_issues = True
            item.status_code = ReceiptItemStatus.UNPLANNED
            item.placement_status = PlacementStatus.PLACED_TO_STOCK
            if item.actual_quantity > 0:
                _upsert_stock_balance(
                    db,
                    storage_zone_id=surplus_zone.id,
                    planned_position_id=None,
                    warehouse_receipt_item_id=str(item.id),
                    quantity_delta=item.actual_quantity,
                )
            issue_event = _create_domain_event(
                db,
                event_type="stock.receipt_issue_opened",
                aggregate_type="warehouse_receipt_item",
                aggregate_id=item.id,
                user_id=confirmed_by,
                payload={
                    "warehouse_receipt_id": str(receipt.id),
                    "issue_type": ConflictType.UNPLANNED_RECEIPT.value,
                    "position_code": item.position_code,
                    "quantity": item.actual_quantity,
                },
                metadata={"source": "stock_receipt"},
                occurred_at=now,
            )
            _create_conflict(
                db,
                conflict_type=ConflictType.UNPLANNED_RECEIPT,
                first_event_id=confirmed_event.id,
                second_event_id=issue_event.id,
                warehouse_receipt_id=str(receipt.id),
                warehouse_receipt_item_id=str(item.id),
                storage_zone_id=str(surplus_zone.id),
                planned_position_id=None,
            )
            continue

        if shortage_quantity > 0:
            any_issues = True
            item.status_code = ReceiptItemStatus.SHORTAGE
            item.placement_status = (
                PlacementStatus.AWAITING_PLACEMENT
                if target_zone.zone_type == StorageZoneType.AWAITING_PLACEMENT
                else PlacementStatus.PARTIALLY_PLACED
            )
            issue_event = _create_domain_event(
                db,
                event_type="stock.receipt_issue_opened",
                aggregate_type="warehouse_receipt_item",
                aggregate_id=item.id,
                user_id=confirmed_by,
                payload={
                    "warehouse_receipt_id": str(receipt.id),
                    "issue_type": ConflictType.RECEIPT_SHORTAGE.value,
                    "position_code": item.position_code,
                    "required_quantity": shortage_quantity,
                },
                metadata={"source": "stock_receipt"},
                occurred_at=now,
            )
            _create_conflict(
                db,
                conflict_type=ConflictType.RECEIPT_SHORTAGE,
                first_event_id=confirmed_event.id,
                second_event_id=issue_event.id,
                warehouse_receipt_id=str(receipt.id),
                warehouse_receipt_item_id=str(item.id),
                storage_zone_id=str(receipt.target_storage_zone_id),
                planned_position_id=str(item.planned_position_id),
            )
            db.add(
                ReceiptFollowUpTask(
                    warehouse_receipt_item_id=item.id,
                    task_type=FollowUpTaskType.SUPPLY_SHORTAGE,
                    required_quantity=shortage_quantity,
                    status_code=FollowUpTaskStatus.OPEN,
                    created_by=confirmed_by,
                    comment_text=comment_text or item.comment_text,
                )
            )
        elif surplus_quantity > 0:
            any_issues = True
            item.status_code = ReceiptItemStatus.SURPLUS
            item.placement_status = (
                PlacementStatus.AWAITING_PLACEMENT
                if target_zone.zone_type == StorageZoneType.AWAITING_PLACEMENT
                else PlacementStatus.PARTIALLY_PLACED
            )
            _upsert_stock_balance(
                db,
                storage_zone_id=surplus_zone.id,
                planned_position_id=str(item.planned_position_id),
                warehouse_receipt_item_id=str(item.id),
                quantity_delta=surplus_quantity,
            )
            issue_event = _create_domain_event(
                db,
                event_type="stock.receipt_issue_opened",
                aggregate_type="warehouse_receipt_item",
                aggregate_id=item.id,
                user_id=confirmed_by,
                payload={
                    "warehouse_receipt_id": str(receipt.id),
                    "issue_type": ConflictType.RECEIPT_SURPLUS.value,
                    "position_code": item.position_code,
                    "surplus_quantity": surplus_quantity,
                },
                metadata={"source": "stock_receipt"},
                occurred_at=now,
            )
            _create_conflict(
                db,
                conflict_type=ConflictType.RECEIPT_SURPLUS,
                first_event_id=confirmed_event.id,
                second_event_id=issue_event.id,
                warehouse_receipt_id=str(receipt.id),
                warehouse_receipt_item_id=str(item.id),
                storage_zone_id=str(surplus_zone.id),
                planned_position_id=str(item.planned_position_id),
            )
        else:
            item.status_code = ReceiptItemStatus.CONFIRMED

        if item.status_code == ReceiptItemStatus.CONFIRMED:
            item.placement_status = (
                PlacementStatus.AWAITING_PLACEMENT
                if target_zone.zone_type == StorageZoneType.AWAITING_PLACEMENT
                else PlacementStatus.PLACED_TO_STOCK
            )

    receipt.status_code = ReceiptStatus.PARTIALLY_CONFIRMED if any_issues else ReceiptStatus.CONFIRMED
    receipt.confirmed_at = now
    if comment_text:
        receipt.comment_text = comment_text

    db.flush()
    return receipt


def resolve_receipt_issue(
    db: Session,
    *,
    receipt_id: str,
    issue_id: str,
    action: str,
    resolved_by: str,
    comment_text: str | None = None,
) -> dict:
    item = db.execute(
        select(WarehouseReceiptItem).where(
            WarehouseReceiptItem.id == issue_id,
            WarehouseReceiptItem.warehouse_receipt_id == receipt_id,
        )
    ).scalar_one_or_none()
    if item is None:
        raise ValueError("Warehouse receipt issue not found.")

    if item.status_code not in {
        ReceiptItemStatus.SHORTAGE,
        ReceiptItemStatus.SURPLUS,
        ReceiptItemStatus.UNPLANNED,
    }:
        raise ValueError("Receipt item does not require issue resolution.")

    now = datetime.now(timezone.utc)
    task = db.execute(
        select(ReceiptFollowUpTask)
        .where(
            ReceiptFollowUpTask.warehouse_receipt_item_id == item.id,
            ReceiptFollowUpTask.status_code.in_([FollowUpTaskStatus.OPEN, FollowUpTaskStatus.IN_PROGRESS]),
        )
        .order_by(ReceiptFollowUpTask.created_at.desc())
    ).scalar_one_or_none()

    conflicts = db.execute(
        select(Conflict).where(
            Conflict.warehouse_receipt_item_id == item.id,
            Conflict.status_code == ConflictStatus.OPEN,
        )
    ).scalars().all()

    normalized_action = action.strip().lower()
    if item.status_code == ReceiptItemStatus.SHORTAGE:
        if normalized_action not in {"close_follow_up", "dismiss_issue"}:
            raise ValueError("Unsupported action for shortage issue.")
        if task is not None:
            task.status_code = FollowUpTaskStatus.RESOLVED if normalized_action == "close_follow_up" else FollowUpTaskStatus.CANCELLED
            task.resolved_at = now
            task.resolved_by = resolved_by
            task.comment_text = comment_text or task.comment_text
        _close_conflicts(conflicts, resolved_by=resolved_by, dismissed=normalized_action == "dismiss_issue", comment_text=comment_text)
    else:
        if normalized_action not in {"accept_surplus", "dismiss_issue"}:
            raise ValueError("Unsupported action for surplus or unplanned issue.")
        _close_conflicts(conflicts, resolved_by=resolved_by, dismissed=normalized_action == "dismiss_issue", comment_text=comment_text)

    resolution_event = _create_domain_event(
        db,
        event_type="stock.receipt_issue_resolved",
        aggregate_type="warehouse_receipt_item",
        aggregate_id=item.id,
        user_id=resolved_by,
        payload={
            "warehouse_receipt_id": receipt_id,
            "issue_type": item.status_code.value,
            "action": normalized_action,
            "comment_text": comment_text,
        },
        metadata={"source": "stock_receipt"},
        occurred_at=now,
    )

    db.flush()
    return {
        "issue_id": str(item.id),
        "action": normalized_action,
        "status_code": "resolved" if normalized_action != "dismiss_issue" else "dismissed",
        "event_id": str(resolution_event.id),
    }


def _upsert_stock_balance(
    db: Session,
    *,
    storage_zone_id,
    planned_position_id: str | None,
    warehouse_receipt_item_id: str | None,
    quantity_delta: int,
) -> None:
    if quantity_delta <= 0:
        return

    balance = db.execute(
        select(StockBalance).where(
            StockBalance.storage_zone_id == storage_zone_id,
            StockBalance.planned_position_id == planned_position_id,
            StockBalance.warehouse_receipt_item_id == warehouse_receipt_item_id,
            StockBalance.planned_item_id.is_(None),
        )
    ).scalar_one_or_none()

    if balance is None:
        balance = StockBalance(
            storage_zone_id=storage_zone_id,
            planned_item_id=None,
            planned_position_id=planned_position_id,
            warehouse_receipt_item_id=warehouse_receipt_item_id,
            quantity_on_hand=quantity_delta,
        )
        db.add(balance)
    else:
        balance.quantity_on_hand += quantity_delta


def _create_domain_event(
    db: Session,
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id,
    user_id: str,
    payload: dict,
    metadata: dict,
    occurred_at: datetime,
) -> DomainEvent:
    event = DomainEvent(
        event_uid=str(uuid4()),
        event_type=event_type,
        aggregate_type=aggregate_type,
        aggregate_id=aggregate_id,
        user_id=user_id,
        device_id=None,
        sync_batch_id=None,
        occurred_at_device=occurred_at,
        recorded_at_server=occurred_at,
        payload_json=payload,
        metadata_json=metadata,
    )
    db.add(event)
    db.flush()
    return event


def _create_conflict(
    db: Session,
    *,
    conflict_type: ConflictType,
    first_event_id,
    second_event_id,
    warehouse_receipt_id: str,
    warehouse_receipt_item_id: str,
    storage_zone_id: str | None,
    planned_position_id: str | None,
) -> Conflict:
    conflict = Conflict(
        conflict_type=conflict_type,
        equipment_instance_id=None,
        planned_position_id=planned_position_id,
        warehouse_receipt_id=warehouse_receipt_id,
        warehouse_receipt_item_id=warehouse_receipt_item_id,
        storage_zone_id=storage_zone_id,
        room_id=None,
        first_event_id=first_event_id,
        second_event_id=second_event_id,
        status_code=ConflictStatus.OPEN,
        resolution_note=None,
    )
    db.add(conflict)
    db.flush()
    return conflict


def _close_conflicts(
    conflicts: list[Conflict],
    *,
    resolved_by: str,
    dismissed: bool,
    comment_text: str | None,
) -> None:
    for conflict in conflicts:
        conflict.status_code = ConflictStatus.DISMISSED if dismissed else ConflictStatus.RESOLVED
        conflict.resolved_by = resolved_by
        conflict.resolved_at = datetime.now(timezone.utc)
        conflict.resolution_note = comment_text or conflict.resolution_note
