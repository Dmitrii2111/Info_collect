from __future__ import annotations

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import ItemPresenceStatus, PnrStatus, SerialState
from app.models.inventory import CommunicationHistory, EquipmentInstance, ItemStatusHistory, PnrHistory
from app.models.org import Department, Floor, Room, User
from app.models.plan import PlannedItem, PlannedPosition
from app.services.plan_queries import get_effective_plan_version_id


def _apply_item_filters(
    stmt,
    *,
    effective_plan_version_id: str | None,
    room_id: str | None = None,
    room_code: str | None = None,
    presence_status: str | None = None,
    serial_state: str | None = None,
    pnr_status: str | None = None,
    communications_status: str | None = None,
    q: str | None = None,
    worklist_filter: str | None = None,
):
    if effective_plan_version_id:
        stmt = stmt.where(PlannedPosition.plan_version_id == effective_plan_version_id)

    if room_id:
        stmt = stmt.where(EquipmentInstance.current_room_id == room_id)
    if room_code:
        stmt = stmt.where(Room.room_code == room_code)
    if presence_status:
        stmt = stmt.where(EquipmentInstance.current_presence_status == presence_status)
    if serial_state:
        stmt = stmt.where(EquipmentInstance.serial_state == serial_state)
    if pnr_status:
        stmt = stmt.where(EquipmentInstance.pnr_status == pnr_status)
    if communications_status:
        stmt = stmt.where(EquipmentInstance.communications_status == communications_status)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                PlannedPosition.position_code.ilike(pattern),
                PlannedPosition.equipment_name.ilike(pattern),
                PlannedPosition.model_mark.ilike(pattern),
                Room.room_code.ilike(pattern),
                Room.room_name.ilike(pattern),
            )
        )

    if worklist_filter == "unchecked":
        stmt = stmt.where(EquipmentInstance.current_presence_status == ItemPresenceStatus.NOT_CHECKED)
    elif worklist_filter == "missing":
        stmt = stmt.where(EquipmentInstance.current_presence_status == ItemPresenceStatus.MISSING)
    elif worklist_filter == "conflict":
        stmt = stmt.where(EquipmentInstance.current_presence_status == ItemPresenceStatus.CONFLICT)
    elif worklist_filter == "no_serial":
        stmt = stmt.where(
            or_(
                EquipmentInstance.serial_state != SerialState.SERIAL_ENTERED,
                EquipmentInstance.serial_number.is_(None),
                EquipmentInstance.serial_number == "",
            )
        )
    elif worklist_filter == "pnr_attention":
        stmt = stmt.where(EquipmentInstance.pnr_status.in_([PnrStatus.NOT_DONE, PnrStatus.INSTALLATION]))

    return stmt


def list_items(
    session: Session,
    *,
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
) -> dict:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    stmt = (
        select(
            EquipmentInstance.id.label("equipment_instance_id"),
            PlannedItem.id.label("planned_item_id"),
            PlannedPosition.plan_version_id,
            EquipmentInstance.current_room_id,
            Room.room_code,
            Room.room_name,
            Floor.code.label("floor_code"),
            Department.name.label("department_name"),
            PlannedPosition.position_code,
            PlannedPosition.equipment_name,
            PlannedPosition.model_mark,
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
        .select_from(EquipmentInstance)
        .join(PlannedItem, PlannedItem.id == EquipmentInstance.planned_item_id)
        .join(PlannedPosition, PlannedPosition.id == PlannedItem.planned_position_id)
        .outerjoin(Room, Room.id == EquipmentInstance.current_room_id)
        .outerjoin(Floor, Floor.id == Room.floor_id)
        .outerjoin(Department, Department.id == Room.department_id)
        .outerjoin(User, User.id == EquipmentInstance.last_checked_by)
    )
    stmt = _apply_item_filters(
        stmt,
        effective_plan_version_id=effective_plan_version_id,
        room_id=room_id,
        room_code=room_code,
        presence_status=presence_status,
        serial_state=serial_state,
        pnr_status=pnr_status,
        communications_status=communications_status,
        q=q,
        worklist_filter=worklist_filter,
    )

    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = int(session.scalar(total_stmt) or 0)

    rows = session.execute(
        stmt.order_by(Room.room_code.asc().nullsfirst(), PlannedPosition.position_code.asc(), PlannedItem.display_label.asc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        {
            "equipment_instance_id": str(row.equipment_instance_id),
            "planned_item_id": str(row.planned_item_id),
            "plan_version_id": str(row.plan_version_id),
            "room_id": str(row.current_room_id) if row.current_room_id else None,
            "room_code": row.room_code,
            "room_name": row.room_name,
            "floor_code": row.floor_code,
            "department_name": row.department_name,
            "position_code": row.position_code,
            "equipment_name": row.equipment_name,
            "model_mark": row.model_mark,
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
        for row in rows
    ]

    return {"total": total, "items": items}


def list_items_for_room_ids(
    session: Session,
    *,
    room_ids: list[str],
    plan_version_id: str | None = None,
) -> list[dict]:
    if not room_ids:
        return []

    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    stmt = (
        select(
            EquipmentInstance.id.label("equipment_instance_id"),
            PlannedItem.id.label("planned_item_id"),
            PlannedPosition.plan_version_id,
            EquipmentInstance.current_room_id,
            Room.room_code,
            Room.room_name,
            Floor.code.label("floor_code"),
            Department.name.label("department_name"),
            PlannedPosition.position_code,
            PlannedPosition.equipment_name,
            PlannedPosition.model_mark,
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
        .select_from(EquipmentInstance)
        .join(PlannedItem, PlannedItem.id == EquipmentInstance.planned_item_id)
        .join(PlannedPosition, PlannedPosition.id == PlannedItem.planned_position_id)
        .outerjoin(Room, Room.id == EquipmentInstance.current_room_id)
        .outerjoin(Floor, Floor.id == Room.floor_id)
        .outerjoin(Department, Department.id == Room.department_id)
        .outerjoin(User, User.id == EquipmentInstance.last_checked_by)
        .where(PlannedPosition.room_id.in_(room_ids))
    )
    stmt = _apply_item_filters(stmt, effective_plan_version_id=effective_plan_version_id)

    rows = session.execute(
        stmt.order_by(Room.room_code.asc().nullsfirst(), PlannedPosition.position_code.asc(), PlannedItem.display_label.asc())
    ).all()

    return [
        {
            "equipment_instance_id": str(row.equipment_instance_id),
            "planned_item_id": str(row.planned_item_id),
            "plan_version_id": str(row.plan_version_id),
            "room_id": str(row.current_room_id) if row.current_room_id else None,
            "room_code": row.room_code,
            "room_name": row.room_name,
            "floor_code": row.floor_code,
            "department_name": row.department_name,
            "position_code": row.position_code,
            "equipment_name": row.equipment_name,
            "model_mark": row.model_mark,
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
        for row in rows
    ]


def get_items_summary(
    session: Session,
    *,
    plan_version_id: str | None = None,
    room_id: str | None = None,
    room_code: str | None = None,
    q: str | None = None,
) -> dict:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    stmt = (
        select(
            func.count().label("total"),
            func.sum(case((EquipmentInstance.current_presence_status == ItemPresenceStatus.NOT_CHECKED, 1), else_=0)).label(
                "unchecked"
            ),
            func.sum(case((EquipmentInstance.current_presence_status == ItemPresenceStatus.MISSING, 1), else_=0)).label(
                "missing"
            ),
            func.sum(case((EquipmentInstance.current_presence_status == ItemPresenceStatus.CONFLICT, 1), else_=0)).label(
                "conflict"
            ),
            func.sum(
                case(
                    (
                        or_(
                            EquipmentInstance.serial_state != SerialState.SERIAL_ENTERED,
                            EquipmentInstance.serial_number.is_(None),
                            EquipmentInstance.serial_number == "",
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("no_serial"),
            func.sum(
                case(
                    (EquipmentInstance.pnr_status.in_([PnrStatus.NOT_DONE, PnrStatus.INSTALLATION]), 1),
                    else_=0,
                )
            ).label("pnr_attention"),
        )
        .select_from(EquipmentInstance)
        .join(PlannedItem, PlannedItem.id == EquipmentInstance.planned_item_id)
        .join(PlannedPosition, PlannedPosition.id == PlannedItem.planned_position_id)
        .outerjoin(Room, Room.id == EquipmentInstance.current_room_id)
    )
    stmt = _apply_item_filters(
        stmt,
        effective_plan_version_id=effective_plan_version_id,
        room_id=room_id,
        room_code=room_code,
        q=q,
    )
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


def get_item_detail(session: Session, planned_item_id: str) -> dict | None:
    stmt = (
        select(
            EquipmentInstance.id.label("equipment_instance_id"),
            PlannedItem.id.label("planned_item_id"),
            PlannedPosition.plan_version_id,
            PlannedItem.display_label,
            PlannedPosition.position_code,
            PlannedPosition.equipment_name,
            PlannedPosition.model_mark,
            EquipmentInstance.current_room_id,
            Room.room_code,
            Room.room_name,
            Floor.code.label("floor_code"),
            Department.name.label("department_name"),
            EquipmentInstance.current_storage_zone_id,
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
        .select_from(PlannedItem)
        .join(EquipmentInstance, EquipmentInstance.planned_item_id == PlannedItem.id)
        .join(PlannedPosition, PlannedPosition.id == PlannedItem.planned_position_id)
        .outerjoin(Room, Room.id == EquipmentInstance.current_room_id)
        .outerjoin(Floor, Floor.id == Room.floor_id)
        .outerjoin(Department, Department.id == Room.department_id)
        .outerjoin(User, User.id == EquipmentInstance.last_checked_by)
        .where(PlannedItem.id == planned_item_id)
    )
    row = session.execute(stmt).first()
    if row is None:
        return None

    status_history_rows = session.execute(
        select(
            ItemStatusHistory.status_code,
            ItemStatusHistory.comment_text,
            User.full_name,
            ItemStatusHistory.changed_at_server,
        )
        .join(User, User.id == ItemStatusHistory.changed_by)
        .where(ItemStatusHistory.equipment_instance_id == row.equipment_instance_id)
        .order_by(ItemStatusHistory.changed_at_server.desc())
    ).all()

    pnr_history_rows = session.execute(
        select(
            PnrHistory.pnr_status,
            PnrHistory.comment_text,
            User.full_name,
            PnrHistory.changed_at_server,
        )
        .join(User, User.id == PnrHistory.changed_by)
        .where(PnrHistory.equipment_instance_id == row.equipment_instance_id)
        .order_by(PnrHistory.changed_at_server.desc())
    ).all()

    communications_history_rows = session.execute(
        select(
            CommunicationHistory.communications_status,
            CommunicationHistory.comment_text,
            User.full_name,
            CommunicationHistory.changed_at_server,
        )
        .join(User, User.id == CommunicationHistory.changed_by)
        .where(CommunicationHistory.equipment_instance_id == row.equipment_instance_id)
        .order_by(CommunicationHistory.changed_at_server.desc())
    ).all()

    return {
        "equipment_instance_id": str(row.equipment_instance_id),
        "planned_item_id": str(row.planned_item_id),
        "plan_version_id": str(row.plan_version_id),
        "room_id": str(row.current_room_id) if row.current_room_id else None,
        "room_code": row.room_code,
        "room_name": row.room_name,
        "floor_code": row.floor_code,
        "department_name": row.department_name,
        "storage_zone_id": str(row.current_storage_zone_id) if row.current_storage_zone_id else None,
        "current_presence_status": row.current_presence_status.value,
        "serial_state": row.serial_state.value,
        "serial_number": row.serial_number,
        "pnr_status": row.pnr_status.value,
        "communications_status": row.communications_status.value,
        "actual_condition": row.actual_condition,
        "completeness_status": row.completeness_status,
        "last_check_at": row.last_check_at,
        "last_checked_by_name": row.last_checked_by_name,
        "position_code": row.position_code,
        "equipment_name": row.equipment_name,
        "model_mark": row.model_mark,
        "display_label": row.display_label,
        "status_history": [
            {
                "entry_type": "presence_status",
                "value": history.status_code.value,
                "comment_text": history.comment_text,
                "changed_by": history.full_name,
                "changed_at_server": history.changed_at_server,
            }
            for history in status_history_rows
        ],
        "pnr_history": [
            {
                "entry_type": "pnr_status",
                "value": history.pnr_status.value,
                "comment_text": history.comment_text,
                "changed_by": history.full_name,
                "changed_at_server": history.changed_at_server,
            }
            for history in pnr_history_rows
        ],
        "communications_history": [
            {
                "entry_type": "communications_status",
                "value": history.communications_status.value,
                "comment_text": history.comment_text,
                "changed_by": history.full_name,
                "changed_at_server": history.changed_at_server,
            }
            for history in communications_history_rows
        ],
    }
