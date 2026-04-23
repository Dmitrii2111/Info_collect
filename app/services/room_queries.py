from __future__ import annotations

from sqlalchemy import case, cast, exists, func, or_, select, true, Date
from sqlalchemy.orm import Session

from app.models.enums import ItemPresenceStatus, PnrStatus, SerialState
from app.models.inventory import EquipmentInstance
from app.models.org import Building, Department, Floor, Room, User
from app.models.plan import PlannedItem, PlannedPosition
from app.models.sync import DomainEvent
from app.services.plan_queries import get_effective_plan_version_id


def _no_serial_condition():
    return or_(
        EquipmentInstance.serial_state != SerialState.SERIAL_ENTERED,
        EquipmentInstance.serial_number.is_(None),
        EquipmentInstance.serial_number == "",
    )


def _pnr_attention_condition():
    return EquipmentInstance.pnr_status.in_([PnrStatus.NOT_DONE, PnrStatus.INSTALLATION])


def _room_worklist_exists(room_id_column, effective_plan_version_id: str | None, worklist_filter: str):
    stmt = (
        select(PlannedItem.id)
        .select_from(PlannedItem)
        .join(PlannedPosition, PlannedPosition.id == PlannedItem.planned_position_id)
        .join(EquipmentInstance, EquipmentInstance.planned_item_id == PlannedItem.id)
        .where(PlannedPosition.room_id == room_id_column)
    )
    if effective_plan_version_id:
        stmt = stmt.where(PlannedPosition.plan_version_id == effective_plan_version_id)

    if worklist_filter == "unchecked":
        stmt = stmt.where(EquipmentInstance.current_presence_status == ItemPresenceStatus.NOT_CHECKED)
    elif worklist_filter == "missing":
        stmt = stmt.where(EquipmentInstance.current_presence_status == ItemPresenceStatus.MISSING)
    elif worklist_filter == "conflict":
        stmt = stmt.where(EquipmentInstance.current_presence_status == ItemPresenceStatus.CONFLICT)
    elif worklist_filter == "no_serial":
        stmt = stmt.where(_no_serial_condition())
    elif worklist_filter == "pnr_attention":
        stmt = stmt.where(_pnr_attention_condition())

    return exists(stmt)


def _build_room_status_flags(row) -> dict:
    return {
        "has_unchecked_items": bool(row.has_unchecked_items),
        "has_missing_items": bool(row.has_missing_items),
        "has_conflict_items": bool(row.has_conflict_items),
        "has_no_serial_items": bool(row.has_no_serial_items),
        "has_pnr_attention_items": bool(row.has_pnr_attention_items),
    }


def list_rooms_with_counts(
    session: Session,
    plan_version_id: str | None = None,
    worklist_filter: str | None = None,
) -> list[dict]:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    unchecked_exists = _room_worklist_exists(Room.id, effective_plan_version_id, "unchecked")
    missing_exists = _room_worklist_exists(Room.id, effective_plan_version_id, "missing")
    conflict_exists = _room_worklist_exists(Room.id, effective_plan_version_id, "conflict")
    no_serial_exists = _room_worklist_exists(Room.id, effective_plan_version_id, "no_serial")
    pnr_attention_exists = _room_worklist_exists(Room.id, effective_plan_version_id, "pnr_attention")

    stmt = (
        select(
            Room.id,
            Room.room_code,
            Room.room_name,
            Floor.code.label("floor_code"),
            Department.name.label("department_name"),
            func.count(func.distinct(PlannedPosition.id)).label("planned_positions_count"),
            func.count(func.distinct(PlannedItem.id)).label("planned_items_count"),
            unchecked_exists.label("has_unchecked_items"),
            missing_exists.label("has_missing_items"),
            conflict_exists.label("has_conflict_items"),
            no_serial_exists.label("has_no_serial_items"),
            pnr_attention_exists.label("has_pnr_attention_items"),
        )
        .select_from(Room)
        .outerjoin(Floor, Floor.id == Room.floor_id)
        .outerjoin(Department, Department.id == Room.department_id)
        .outerjoin(
            PlannedPosition,
            (PlannedPosition.room_id == Room.id)
            & (
                PlannedPosition.plan_version_id == effective_plan_version_id
                if effective_plan_version_id
                else true()
            ),
        )
        .outerjoin(PlannedItem, PlannedItem.planned_position_id == PlannedPosition.id)
        .group_by(Room.id, Room.room_code, Room.room_name, Floor.code, Department.name)
        .having(func.count(func.distinct(PlannedPosition.id)) > 0)
        .order_by(Room.room_code.asc())
    )

    if worklist_filter == "unchecked":
        stmt = stmt.where(unchecked_exists)
    elif worklist_filter == "missing":
        stmt = stmt.where(missing_exists)
    elif worklist_filter == "conflict":
        stmt = stmt.where(conflict_exists)
    elif worklist_filter == "no_serial":
        stmt = stmt.where(no_serial_exists)
    elif worklist_filter == "pnr_attention":
        stmt = stmt.where(pnr_attention_exists)

    rows = session.execute(stmt).all()
    return [
        {
            "room_id": str(row.id),
            "plan_version_id": effective_plan_version_id,
            "room_code": row.room_code,
            "room_name": row.room_name,
            "floor_code": row.floor_code,
            "department_name": row.department_name,
            "planned_positions_count": int(row.planned_positions_count or 0),
            "planned_items_count": int(row.planned_items_count or 0),
            "status_flags": _build_room_status_flags(row),
        }
        for row in rows
    ]


def get_rooms_summary(session: Session, plan_version_id: str | None = None) -> dict:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    stmt = (
        select(
            func.count(func.distinct(Room.id)).label("total"),
            func.count(
                func.distinct(
                    case((_room_worklist_exists(Room.id, effective_plan_version_id, "unchecked"), Room.id), else_=None)
                )
            ).label("unchecked"),
            func.count(
                func.distinct(
                    case((_room_worklist_exists(Room.id, effective_plan_version_id, "missing"), Room.id), else_=None)
                )
            ).label("missing"),
            func.count(
                func.distinct(
                    case((_room_worklist_exists(Room.id, effective_plan_version_id, "conflict"), Room.id), else_=None)
                )
            ).label("conflict"),
            func.count(
                func.distinct(
                    case((_room_worklist_exists(Room.id, effective_plan_version_id, "no_serial"), Room.id), else_=None)
                )
            ).label("no_serial"),
            func.count(
                func.distinct(
                    case(
                        (_room_worklist_exists(Room.id, effective_plan_version_id, "pnr_attention"), Room.id),
                        else_=None,
                    )
                )
            ).label("pnr_attention"),
        )
        .select_from(Room)
        .join(PlannedPosition, PlannedPosition.room_id == Room.id)
    )
    if effective_plan_version_id:
        stmt = stmt.where(PlannedPosition.plan_version_id == effective_plan_version_id)

    row = session.execute(stmt).one()
    return {
        "plan_version_id": effective_plan_version_id,
        "total": int(row.total or 0),
        "worklist": {
            "unchecked": int(row.unchecked or 0),
            "missing": int(row.missing or 0),
            "conflict": int(row.conflict or 0),
            "no_serial": int(row.no_serial or 0),
            "pnr_attention": int(row.pnr_attention or 0),
        },
    }


def get_room_completion_activity(session: Session, plan_version_id: str | None = None, limit_days: int = 14) -> dict:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    room_ids_stmt = select(Room.id).join(PlannedPosition, PlannedPosition.room_id == Room.id)
    if effective_plan_version_id:
        room_ids_stmt = room_ids_stmt.where(PlannedPosition.plan_version_id == effective_plan_version_id)
    room_ids_subquery = room_ids_stmt.distinct().subquery()

    activity_stmt = (
        select(
            cast(DomainEvent.recorded_at_server, Date).label("completed_date"),
            User.id.label("user_id"),
            User.full_name.label("full_name"),
            func.count(func.distinct(DomainEvent.aggregate_id)).label("completed_rooms_count"),
        )
        .select_from(DomainEvent)
        .outerjoin(User, User.id == DomainEvent.user_id)
        .where(
            DomainEvent.event_type == "room.check_completed",
            DomainEvent.aggregate_type == "room",
            DomainEvent.aggregate_id.in_(select(room_ids_subquery.c.id)),
        )
        .group_by(cast(DomainEvent.recorded_at_server, Date), User.id, User.full_name)
        .order_by(cast(DomainEvent.recorded_at_server, Date).desc(), func.count(func.distinct(DomainEvent.aggregate_id)).desc())
    )

    rows = session.execute(activity_stmt).all()
    day_map: dict[str, dict] = {}
    for row in rows:
        if row.completed_date is None:
            continue
        day_key = row.completed_date.isoformat()
        day_entry = day_map.setdefault(
            day_key,
            {
                "date": day_key,
                "total_completed_rooms": 0,
                "employees": [],
            },
        )
        completed_count = int(row.completed_rooms_count or 0)
        day_entry["employees"].append(
            {
                "user_id": str(row.user_id) if row.user_id else None,
                "full_name": row.full_name or "Неизвестный сотрудник",
                "completed_rooms_count": completed_count,
            }
        )
        day_entry["total_completed_rooms"] += completed_count

    ordered_days = sorted(day_map.values(), key=lambda item: item["date"], reverse=True)[:limit_days]
    ordered_days.reverse()
    return {
        "plan_version_id": effective_plan_version_id,
        "days": ordered_days,
    }


def get_room_detail(session: Session, room_id: str, plan_version_id: str | None = None) -> dict | None:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    room_stmt = (
        select(
            Room.id,
            Room.room_code,
            Room.room_name,
            Floor.code.label("floor_code"),
            Department.name.label("department_name"),
            Building.code.label("building_code"),
        )
        .select_from(Room)
        .join(Building, Building.id == Room.building_id)
        .outerjoin(Floor, Floor.id == Room.floor_id)
        .outerjoin(Department, Department.id == Room.department_id)
        .where(Room.id == room_id)
    )
    if effective_plan_version_id:
        room_stmt = room_stmt.where(
            select(PlannedPosition.id)
            .where(
                PlannedPosition.room_id == Room.id,
                PlannedPosition.plan_version_id == effective_plan_version_id,
            )
            .exists()
        )
    room = session.execute(room_stmt).first()
    if room is None:
        return None

    items_stmt = (
        select(
            PlannedPosition.id.label("planned_position_id"),
            PlannedPosition.position_code,
            PlannedPosition.equipment_name,
            PlannedPosition.model_mark,
            PlannedPosition.planned_quantity,
            PlannedItem.id.label("planned_item_id"),
            PlannedItem.display_label,
            EquipmentInstance.current_presence_status,
            EquipmentInstance.serial_state,
            EquipmentInstance.serial_number,
            EquipmentInstance.pnr_status,
            EquipmentInstance.communications_status,
            EquipmentInstance.actual_condition,
            EquipmentInstance.completeness_status,
            EquipmentInstance.last_check_at,
            User.full_name.label("last_checked_by_name"),
        )
        .select_from(PlannedPosition)
        .join(PlannedItem, PlannedItem.planned_position_id == PlannedPosition.id)
        .join(EquipmentInstance, EquipmentInstance.planned_item_id == PlannedItem.id)
        .outerjoin(User, User.id == EquipmentInstance.last_checked_by)
        .where(PlannedPosition.room_id == room.id)
        .where(
            PlannedPosition.plan_version_id == effective_plan_version_id
            if effective_plan_version_id
            else true()
        )
        .order_by(PlannedPosition.position_code.asc(), PlannedItem.ordinal_no.asc())
    )
    rows = session.execute(items_stmt).all()

    positions_map: dict[str, dict] = {}
    position_order: list[str] = []
    status_flags = {
        "has_unchecked_items": False,
        "has_missing_items": False,
        "has_conflict_items": False,
        "has_no_serial_items": False,
        "has_pnr_attention_items": False,
    }

    for row in rows:
        position_id = str(row.planned_position_id)
        if position_id not in positions_map:
            positions_map[position_id] = {
                "planned_position_id": position_id,
                "position_code": row.position_code,
                "equipment_name": row.equipment_name,
                "model_mark": row.model_mark,
                "planned_quantity": row.planned_quantity,
                "items": [],
            }
            position_order.append(position_id)

        if row.current_presence_status == ItemPresenceStatus.NOT_CHECKED:
            status_flags["has_unchecked_items"] = True
        if row.current_presence_status == ItemPresenceStatus.MISSING:
            status_flags["has_missing_items"] = True
        if row.current_presence_status == ItemPresenceStatus.CONFLICT:
            status_flags["has_conflict_items"] = True
        if row.serial_state != SerialState.SERIAL_ENTERED or not row.serial_number:
            status_flags["has_no_serial_items"] = True
        if row.pnr_status in {PnrStatus.NOT_DONE, PnrStatus.INSTALLATION}:
            status_flags["has_pnr_attention_items"] = True

        positions_map[position_id]["items"].append(
            {
                "planned_item_id": str(row.planned_item_id),
                "display_label": row.display_label,
                "current_presence_status": row.current_presence_status.value,
                "serial_state": row.serial_state.value,
                "serial_number": row.serial_number,
                "pnr_status": row.pnr_status.value,
                "communications_status": row.communications_status.value,
                "actual_condition": row.actual_condition,
                "completeness_status": row.completeness_status,
                "last_check_at": row.last_check_at,
                "last_checked_by_name": row.last_checked_by_name,
            }
        )

    return {
        "room_id": str(room.id),
        "plan_version_id": effective_plan_version_id,
        "room_code": room.room_code,
        "room_name": room.room_name,
        "floor_code": room.floor_code,
        "department_name": room.department_name,
        "building_code": room.building_code,
        "status_flags": status_flags,
        "positions": [positions_map[position_id] for position_id in position_order],
    }
