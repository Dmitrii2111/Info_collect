from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import distinct, func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import (
    CheckType,
    CommunicationsStatus,
    ConflictStatus,
    ConflictType,
    ItemPresenceStatus,
    PnrStatus,
    SerialState,
    UserRole,
)
from app.models.inventory import CommunicationHistory, Conflict, EquipmentInstance, ItemCheck, ItemStatusHistory, PnrHistory
from app.models.org import Device, Room, Team, User, UserAssignment, UserTeamMembership
from app.models.plan import PlannedItem, PlannedPosition
from app.models.sync import DomainEvent
from app.services.item_queries import list_items_for_room_ids
from app.services.plan_queries import get_effective_plan_version_id
from app.services.room_queries import list_rooms_with_counts


def get_or_create_field_user(session: Session, worker_login: str, worker_full_name: str | None = None) -> User:
    user = session.scalar(select(User).where(User.login == worker_login))
    if user is not None:
        if worker_full_name and user.full_name != worker_full_name:
            user.full_name = worker_full_name
        return user

    full_name = (worker_full_name or worker_login).strip()
    name_parts = full_name.split()
    last_name = name_parts[0] if name_parts else worker_login
    first_name = name_parts[1] if len(name_parts) > 1 else worker_login
    middle_name = " ".join(name_parts[2:]) if len(name_parts) > 2 else None

    user = User(
        login=worker_login,
        password_hash="disabled",
        last_name=last_name,
        first_name=first_name,
        middle_name=middle_name,
        full_name=full_name,
        role=UserRole.OPERATOR,
        is_active=True,
    )
    session.add(user)
    session.flush()
    return user


def get_or_create_device(
    session: Session,
    *,
    user_id,
    device_uid: str,
    platform: str,
    app_version: str | None = None,
) -> Device:
    device = session.scalar(select(Device).where(Device.device_uid == device_uid))
    now = datetime.now(timezone.utc)
    if device is None:
        device = Device(
            user_id=user_id,
            device_uid=device_uid,
            platform=platform,
            app_version=app_version,
            last_seen_at=now,
        )
        session.add(device)
        session.flush()
        return device

    device.user_id = user_id
    device.platform = platform
    device.app_version = app_version
    device.last_seen_at = now
    session.flush()
    return device


def get_progress_user_ids(session: Session, *, user_id: str) -> list[str]:
    team = session.scalar(
        select(Team)
        .join(UserTeamMembership, UserTeamMembership.team_id == Team.id)
        .where(UserTeamMembership.user_id == user_id, UserTeamMembership.ended_at.is_(None), Team.is_active.is_(True))
        .order_by(UserTeamMembership.started_at.desc())
    )
    if team is None:
        return [str(user_id)]
    member_ids = session.execute(
        select(UserTeamMembership.user_id).where(
            UserTeamMembership.team_id == team.id,
            UserTeamMembership.ended_at.is_(None),
        )
    ).scalars().all()
    return [str(member_id) for member_id in member_ids] or [str(user_id)]


def list_field_assignments(
    session: Session,
    *,
    worker_login: str,
    worker_full_name: str | None = None,
    plan_version_id: str | None = None,
) -> dict:
    user = get_or_create_field_user(session, worker_login, worker_full_name)
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)

    assignments = session.execute(
        select(UserAssignment).where(
            UserAssignment.user_id == user.id,
            UserAssignment.ended_at.is_(None),
        )
    ).scalars().all()

    room_rows = list_rooms_with_counts(session, plan_version_id=effective_plan_version_id)
    if not assignments:
        return {
            "worker_login": user.login,
            "worker_full_name": user.full_name,
            "plan_version_id": effective_plan_version_id,
            "assignment_mode": "assigned_rooms",
            "rooms": [],
        }

    selected_room_ids: set[str] = set()
    assignment_mode = "assigned_rooms"

    for assignment in assignments:
        if assignment.room_id:
            selected_room_ids.add(str(assignment.room_id))
            continue

        for row in room_rows:
            include = False
            if assignment.floor_id and row["floor_code"]:
                room_floor = session.scalar(select(Room.floor_id).where(Room.id == row["room_id"]))
                include = str(room_floor) == str(assignment.floor_id)
            elif assignment.department_id and row["department_name"]:
                room_department = session.scalar(select(Room.department_id).where(Room.id == row["room_id"]))
                include = str(room_department) == str(assignment.department_id)
            elif assignment.building_id:
                include = True

            if include:
                selected_room_ids.add(row["room_id"])

    progress_user_ids = get_progress_user_ids(session, user_id=user.id)
    completed_at_map = {
        str(room_id): completed_at
        for room_id, completed_at in session.execute(
            select(DomainEvent.aggregate_id, func.max(DomainEvent.recorded_at_server))
            .where(
                DomainEvent.event_type == "room.check_completed",
                DomainEvent.aggregate_type == "room",
                DomainEvent.user_id.in_(progress_user_ids),
            )
            .group_by(DomainEvent.aggregate_id)
        ).all()
    }

    filtered_rows = [
        {
            **row,
            "completed_at": completed_at_map.get(row["room_id"]),
            "repeat_check_required": completed_at_map.get(row["room_id"]) is not None,
        }
        for row in room_rows
        if row["room_id"] in selected_room_ids
    ]
    return {
        "worker_login": user.login,
        "worker_full_name": user.full_name,
        "plan_version_id": effective_plan_version_id,
        "assignment_mode": assignment_mode,
        "rooms": filtered_rows,
    }


def build_field_bootstrap(
    session: Session,
    *,
    worker_login: str,
    worker_full_name: str | None,
    device_uid: str,
    platform: str,
    app_version: str | None,
    plan_version_id: str | None = None,
) -> dict:
    assignments = list_field_assignments(
        session,
        worker_login=worker_login,
        worker_full_name=worker_full_name,
        plan_version_id=plan_version_id,
    )
    user = get_or_create_field_user(session, worker_login, worker_full_name)
    device = get_or_create_device(
        session,
        user_id=user.id,
        device_uid=device_uid,
        platform=platform,
        app_version=app_version,
    )

    room_ids = [row["room_id"] for row in assignments["rooms"]]
    items = list_items_for_room_ids(
        session,
        room_ids=room_ids,
        plan_version_id=assignments["plan_version_id"],
    )
    progress_user_ids = get_progress_user_ids(session, user_id=user.id)
    completed_room_ids = session.execute(
        select(distinct(DomainEvent.aggregate_id))
        .where(
            DomainEvent.event_type == "room.check_completed",
            DomainEvent.aggregate_type == "room",
            DomainEvent.user_id.in_(progress_user_ids),
        )
    ).scalars().all()
    assigned_room_ids = set(room_ids)
    completed_count = sum(1 for room_id in completed_room_ids if str(room_id) in assigned_room_ids)

    return {
        "worker_login": assignments["worker_login"],
        "worker_full_name": assignments["worker_full_name"],
        "plan_version_id": assignments["plan_version_id"],
        "synced_at": datetime.now(timezone.utc),
        "assignment_mode": assignments["assignment_mode"],
        "assigned_rooms_count": len(room_ids),
        "completed_rooms_count": completed_count,
        "device": {
            "device_id": str(device.id),
            "device_uid": device.device_uid,
            "platform": device.platform,
            "app_version": device.app_version,
            "last_seen_at": device.last_seen_at,
        },
        "rooms": assignments["rooms"],
        "items": items,
        "lookups": {
            "presence_statuses": [
                {"code": ItemPresenceStatus.NOT_CHECKED.value, "label": "Не проверено"},
                {"code": ItemPresenceStatus.FOUND.value, "label": "Найдено"},
                {"code": ItemPresenceStatus.MISSING.value, "label": "Отсутствует"},
                {"code": ItemPresenceStatus.IN_STORAGE.value, "label": "На складе"},
                {"code": ItemPresenceStatus.MOVED_TO_ROOM.value, "label": "Перемещено в помещение"},
                {"code": ItemPresenceStatus.AWAITING_REPEAT_CHECK.value, "label": "Ожидает повторной проверки"},
                {"code": ItemPresenceStatus.CONFLICT.value, "label": "Конфликт"},
            ],
            "serial_states": [
                {"code": SerialState.SERIAL_ENTERED.value, "label": "Серийный номер указан"},
                {"code": SerialState.NOT_PROVIDED.value, "label": "Не предусмотрен"},
                {"code": SerialState.UNKNOWN.value, "label": "Неизвестно"},
            ],
            "pnr_statuses": [
                {"code": PnrStatus.NOT_REQUIRED.value, "label": "Не требуется"},
                {"code": PnrStatus.NOT_DONE.value, "label": "Не проведено"},
                {"code": PnrStatus.DONE.value, "label": "Проведено"},
                {"code": PnrStatus.INSTALLATION.value, "label": "Монтаж"},
            ],
            "communications_statuses": [
                {"code": CommunicationsStatus.MISSING.value, "label": "Отсутствуют"},
                {"code": CommunicationsStatus.DONE.value, "label": "Выполнены"},
                {"code": CommunicationsStatus.DONE_WITH_ERRORS.value, "label": "Выполнены с ошибками"},
                {"code": CommunicationsStatus.NOT_PROVIDED.value, "label": "Не предусмотрено"},
            ],
        },
    }


def submit_field_item_check(
    session: Session,
    *,
    worker_login: str,
    worker_full_name: str | None,
    planned_item_id: str,
    device_uid: str,
    platform: str,
    app_version: str | None,
    presence_status: ItemPresenceStatus,
    serial_state: SerialState,
    serial_number: str | None,
    pnr_status: PnrStatus,
    communications_status: CommunicationsStatus,
    actual_condition: str | None,
    completeness_status: str | None,
    comment_text: str | None,
    created_at_device: datetime | None,
    event_uid: str | None,
    is_repeat_check: bool,
    repeat_check_id: str | None,
    sync_batch_id=None,
) -> tuple[EquipmentInstance, User, Device, bool]:
    if serial_state == SerialState.SERIAL_ENTERED and not serial_number:
        raise ValueError("Serial number is required when serial_state=serial_entered")

    user = get_or_create_field_user(session, worker_login, worker_full_name)
    device = get_or_create_device(
        session,
        user_id=user.id,
        device_uid=device_uid,
        platform=platform,
        app_version=app_version,
    )

    row = session.execute(
        select(EquipmentInstance, PlannedItem, PlannedPosition)
        .join(PlannedItem, PlannedItem.id == EquipmentInstance.planned_item_id)
        .join(PlannedPosition, PlannedPosition.id == PlannedItem.planned_position_id)
        .where(PlannedItem.id == planned_item_id)
    ).first()
    if row is None:
        raise ValueError("Equipment instance not found")

    instance, planned_item, planned_position = row
    previous_presence_status = instance.current_presence_status
    previous_event_id = instance.last_event_id
    previous_checked_by = instance.last_checked_by
    device_time = created_at_device or datetime.now(timezone.utc)
    server_time = datetime.now(timezone.utc)

    event = DomainEvent(
        event_uid=event_uid or str(uuid.uuid4()),
        event_type="item.repeat_checked" if is_repeat_check else "item.checked",
        aggregate_type="equipment_instance",
        aggregate_id=instance.id,
        user_id=user.id,
        device_id=device.id,
        sync_batch_id=sync_batch_id,
        occurred_at_device=device_time,
        recorded_at_server=server_time,
        payload_json={
            "planned_item_id": planned_item_id,
            "presence_status": presence_status.value,
            "serial_state": serial_state.value,
            "serial_number": serial_number,
            "pnr_status": pnr_status.value,
            "communications_status": communications_status.value,
            "actual_condition": actual_condition,
            "completeness_status": completeness_status,
            "comment_text": comment_text,
            "is_repeat_check": is_repeat_check,
            "repeat_check_id": repeat_check_id,
        },
        metadata_json={"source": "field"},
    )
    session.add(event)
    session.flush()

    conflict_created = False
    if (
        previous_presence_status != ItemPresenceStatus.NOT_CHECKED
        and previous_presence_status != presence_status
        and previous_checked_by is not None
        and previous_checked_by != user.id
        and previous_event_id is not None
    ):
        conflict_created = True
        instance.current_presence_status = ItemPresenceStatus.CONFLICT
        session.add(
            Conflict(
                conflict_type=ConflictType.PRESENCE_MISMATCH,
                equipment_instance_id=instance.id,
                room_id=planned_position.room_id,
                first_event_id=previous_event_id,
                second_event_id=event.id,
                status_code=ConflictStatus.OPEN,
            )
        )
        status_for_history = ItemPresenceStatus.CONFLICT
    else:
        status_for_history = presence_status
        instance.current_presence_status = presence_status

    if presence_status in {ItemPresenceStatus.FOUND, ItemPresenceStatus.MOVED_TO_ROOM}:
        instance.current_room_id = planned_position.room_id
        instance.current_storage_zone_id = None

    if presence_status == ItemPresenceStatus.IN_STORAGE:
        instance.current_room_id = None

    instance.serial_state = serial_state
    instance.serial_number = serial_number if serial_state == SerialState.SERIAL_ENTERED else None
    instance.pnr_status = pnr_status
    instance.communications_status = communications_status
    instance.actual_condition = actual_condition
    instance.completeness_status = completeness_status
    instance.last_check_at = server_time
    instance.last_checked_by = user.id
    instance.last_event_id = event.id
    instance.version_no += 1

    item_check = ItemCheck(
        equipment_instance_id=instance.id,
        planned_item_id=instance.planned_item_id,
        room_id=planned_position.room_id,
        check_type=CheckType.REPEAT_CHECK if is_repeat_check else CheckType.INITIAL_CHECK,
        presence_status=presence_status,
        serial_number=instance.serial_number,
        serial_state=instance.serial_state,
        pnr_status=instance.pnr_status,
        communications_status=instance.communications_status,
        actual_condition=instance.actual_condition,
        completeness_status=instance.completeness_status,
        comment_text=comment_text,
        created_by=user.id,
            device_id=device.id,
            created_at_device=device_time,
            received_at_server=server_time,
            sync_batch_id=sync_batch_id,
            is_repeat_check=is_repeat_check,
            repeat_check_id=repeat_check_id,
            source_event_id=event.id,
    )
    session.add(item_check)
    session.flush()

    session.add(
        ItemStatusHistory(
            equipment_instance_id=instance.id,
            status_code=status_for_history,
            comment_text=comment_text,
            changed_by=user.id,
            changed_at_device=device_time,
            changed_at_server=server_time,
            source_check_id=item_check.id,
            source_event_id=event.id,
        )
    )
    session.add(
        PnrHistory(
            equipment_instance_id=instance.id,
            pnr_status=pnr_status,
            comment_text=comment_text,
            changed_by=user.id,
            changed_at_device=device_time,
            changed_at_server=server_time,
            source_check_id=item_check.id,
            source_event_id=event.id,
        )
    )
    session.add(
        CommunicationHistory(
            equipment_instance_id=instance.id,
            communications_status=communications_status,
            comment_text=comment_text,
            changed_by=user.id,
            changed_at_device=device_time,
            changed_at_server=server_time,
            source_check_id=item_check.id,
            source_event_id=event.id,
        )
    )

    session.flush()
    return instance, user, device, conflict_created


def complete_room_check(
    session: Session,
    *,
    room_id: str,
    worker_login: str,
    worker_full_name: str | None,
    device_uid: str,
    platform: str,
    app_version: str | None,
    comment_text: str | None,
    created_at_device: datetime | None,
    event_uid: str | None,
    checked_items_count: int | None,
    sync_batch_id=None,
) -> tuple[Room, User, Device, datetime]:
    user = get_or_create_field_user(session, worker_login, worker_full_name)
    device = get_or_create_device(
        session,
        user_id=user.id,
        device_uid=device_uid,
        platform=platform,
        app_version=app_version,
    )
    room = session.scalar(select(Room).where(Room.id == room_id))
    if room is None:
        raise ValueError("Room not found")

    device_time = created_at_device or datetime.now(timezone.utc)
    server_time = datetime.now(timezone.utc)

    event = DomainEvent(
        event_uid=event_uid or str(uuid.uuid4()),
        event_type="room.check_completed",
        aggregate_type="room",
        aggregate_id=room.id,
        user_id=user.id,
        device_id=device.id,
        sync_batch_id=sync_batch_id,
        occurred_at_device=device_time,
        recorded_at_server=server_time,
        payload_json={
            "room_id": str(room.id),
            "room_code": room.room_code,
            "checked_items_count": checked_items_count,
            "comment_text": comment_text,
        },
        metadata_json={"source": "field"},
    )
    session.add(event)
    session.flush()

    return room, user, device, server_time
