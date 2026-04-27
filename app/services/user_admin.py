from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.inventory import Conflict, ItemCheck
from app.models.enums import ConflictStatus, ConflictType, UserRole
from app.models.org import Department, Floor, Room, Team, User, UserAssignment, UserTeamMembership
from app.models.sync import DomainEvent
from app.services.field_actions import get_or_create_device
from app.services.plan_queries import get_effective_plan_version_id
from app.services.room_queries import list_rooms_with_counts


BASE_DIR = Path(__file__).resolve().parents[2]
USER_AVATAR_DIR = BASE_DIR / "static" / "uploads" / "user-avatars"
ALLOWED_AVATAR_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def list_field_users(session: Session) -> list[dict]:
    rows = session.execute(
        select(
            User.id,
            User.login,
            User.full_name,
            User.last_name,
            User.first_name,
            User.middle_name,
            User.role,
            User.is_active,
            User.phone,
            User.email,
            User.avatar_url,
            func.count(UserAssignment.id).label("active_assignments_count"),
        )
        .select_from(User)
        .outerjoin(
            UserAssignment,
            (UserAssignment.user_id == User.id) & (UserAssignment.ended_at.is_(None)),
        )
        .where(User.login != "system")
        .group_by(
            User.id,
            User.login,
            User.full_name,
            User.last_name,
            User.first_name,
            User.middle_name,
            User.role,
            User.is_active,
            User.phone,
            User.email,
            User.avatar_url,
        )
        .order_by(User.full_name.asc())
    ).all()
    items: list[dict] = []
    for row in rows:
        progress_summary = _get_user_progress_summary(session, user_id=str(row.id))
        items.append(
            {
                "user_id": str(row.id),
                "login": row.login,
                "full_name": row.full_name,
                "last_name": row.last_name,
                "first_name": row.first_name,
                "middle_name": row.middle_name,
                "role": row.role.value,
                "is_active": row.is_active,
                "phone": row.phone,
                "email": row.email,
                "avatar_url": row.avatar_url,
                "active_assignments_count": int(row.active_assignments_count or 0),
                "assigned_rooms_count": progress_summary["assigned_rooms_count"],
                "completed_rooms_count": progress_summary["completed_rooms_count"],
                "in_progress_rooms_count": progress_summary["in_progress_rooms_count"],
                "not_started_rooms_count": progress_summary["not_started_rooms_count"],
                "work_status": progress_summary["work_status"],
            }
        )
    return items


def get_active_team_for_user(session: Session, *, user_id: str) -> Team | None:
    return session.scalar(
        select(Team)
        .join(UserTeamMembership, UserTeamMembership.team_id == Team.id)
        .where(UserTeamMembership.user_id == user_id, UserTeamMembership.ended_at.is_(None), Team.is_active.is_(True))
        .order_by(UserTeamMembership.started_at.desc())
    )


def get_progress_user_ids_for_user(session: Session, *, user_id: str) -> list[str]:
    team = get_active_team_for_user(session, user_id=user_id)
    if team is None:
        return [user_id]
    member_ids = session.execute(
        select(UserTeamMembership.user_id).where(
            UserTeamMembership.team_id == team.id,
            UserTeamMembership.ended_at.is_(None),
        )
    ).scalars().all()
    return [str(member_id) for member_id in member_ids] or [user_id]


def list_groups(session: Session) -> list[dict]:
    teams = session.execute(
        select(Team).where(Team.is_active.is_(True)).order_by(Team.name.asc())
    ).scalars().all()
    return [_build_team_summary(session, team=team) for team in teams]


def get_group_detail(session: Session, *, team_id: str) -> dict:
    team = session.scalar(select(Team).where(Team.id == team_id, Team.is_active.is_(True)))
    if team is None:
        raise ValueError("Group not found")
    return _build_team_summary(session, team=team)


def create_team(session: Session, *, team_name: str, member_user_ids: list[str]) -> Team:
    normalized_member_ids = _normalize_member_ids(session, member_user_ids)
    if len(normalized_member_ids) < 2:
        raise ValueError("Group must contain at least two active employees")

    team = Team(name=team_name.strip(), is_active=True)
    session.add(team)
    session.flush()
    _set_team_memberships(session, team_id=str(team.id), member_user_ids=normalized_member_ids)
    session.flush()
    return team


def merge_users_into_team(
    session: Session,
    *,
    primary_user_id: str,
    other_user_ids: list[str],
    team_name: str | None = None,
) -> Team:
    member_ids = _normalize_member_ids(session, [primary_user_id, *other_user_ids])
    if len(member_ids) < 2:
        raise ValueError("Need at least two active employees to create a group")

    existing_team = get_active_team_for_user(session, user_id=primary_user_id)
    if existing_team is not None:
        _set_team_memberships(session, team_id=str(existing_team.id), member_user_ids=member_ids)
        session.flush()
        return existing_team

    team = Team(name=(team_name or _build_default_team_name(session, member_ids)).strip(), is_active=True)
    session.add(team)
    session.flush()
    _set_team_memberships(session, team_id=str(team.id), member_user_ids=member_ids)
    session.flush()
    return team


def update_team(
    session: Session,
    *,
    team_id: str,
    team_name: str,
    member_user_ids: list[str],
) -> tuple[Team | None, dict]:
    team = session.scalar(select(Team).where(Team.id == team_id, Team.is_active.is_(True)))
    if team is None:
        raise ValueError("Group not found")

    normalized_member_ids = _normalize_member_ids(session, member_user_ids)
    if len(normalized_member_ids) < 2:
        result = delete_team(session, team_id=team_id, create_conflicts=False)
        if normalized_member_ids:
            return None, {
                "disbanded": True,
                "disbanded_to_user_id": normalized_member_ids[0],
                "conflicts_created": result["conflicts_created"],
            }
        return None, {
            "disbanded": True,
            "disbanded_to_user_id": None,
            "conflicts_created": result["conflicts_created"],
        }

    team.name = team_name.strip()
    _set_team_memberships(session, team_id=team_id, member_user_ids=normalized_member_ids)
    session.flush()
    return team, {
        "disbanded": False,
        "disbanded_to_user_id": None,
        "conflicts_created": 0,
    }


def delete_team(session: Session, *, team_id: str, create_conflicts: bool = True) -> dict:
    team = session.scalar(select(Team).where(Team.id == team_id, Team.is_active.is_(True)))
    if team is None:
        raise ValueError("Group not found")

    conflicts_created = _create_team_overlap_conflicts(session, team=team) if create_conflicts else 0
    _disband_team(session, team=team)
    session.flush()
    return {"team_id": team_id, "conflicts_created": conflicts_created}


def build_assignment_overlap_preview(session: Session, *, user_id: str, room_ids: list[str]) -> dict:
    normalized_room_ids = sorted({room_id for room_id in room_ids if room_id})
    if not normalized_room_ids:
        return {"user_id": user_id, "overlap_count": 0, "overlaps": []}
    primary_team = get_active_team_for_user(session, user_id=user_id)

    room_rows = {
        str(room.id): room
        for room in session.execute(select(Room).where(Room.id.in_(normalized_room_ids))).scalars()
    }
    active_assignments = session.execute(
        select(UserAssignment, User)
        .join(User, User.id == UserAssignment.user_id)
        .where(
            UserAssignment.ended_at.is_(None),
            UserAssignment.room_id.in_(normalized_room_ids),
            UserAssignment.user_id != user_id,
            User.role == UserRole.OPERATOR,
            User.is_active.is_(True),
        )
    ).all()

    overlaps: list[dict] = []
    team_cache: dict[str, Team | None] = {}
    for assignment, other_user in active_assignments:
        room = room_rows.get(str(assignment.room_id))
        if room is None:
            continue
        if str(other_user.id) not in team_cache:
            team_cache[str(other_user.id)] = get_active_team_for_user(session, user_id=str(other_user.id))
        team = team_cache[str(other_user.id)]
        if primary_team is not None and team is not None and str(primary_team.id) == str(team.id):
            continue
        overlaps.append(
            {
                "room_id": str(room.id),
                "room_code": room.room_code,
                "room_name": room.room_name,
                "other_user_id": str(other_user.id),
                "other_user_name": other_user.full_name,
                "other_group_id": str(team.id) if team else None,
                "other_group_name": team.name if team else None,
            }
        )

    overlaps.sort(key=lambda row: (row["room_code"], row["other_user_name"]))
    return {
        "user_id": user_id,
        "overlap_count": len(overlaps),
        "overlaps": overlaps,
    }


def create_field_user(
    session: Session,
    *,
    login: str,
    password: str,
    last_name: str,
    first_name: str,
    middle_name: str | None,
    phone: str | None,
    email: str | None,
    role: UserRole,
) -> User:
    existing = session.scalar(select(User).where(User.login == login))
    if existing is not None:
        raise ValueError("User with this login already exists")
    if email:
        existing_email = session.scalar(select(User).where(func.lower(User.email) == email.lower()))
        if existing_email is not None:
            raise ValueError("User with this email already exists")

    full_name = " ".join(part for part in [last_name, first_name, middle_name] if part)
    user = User(
        login=login,
        password_hash=password,
        last_name=last_name,
        first_name=first_name,
        middle_name=middle_name,
        full_name=full_name,
        role=role,
        is_active=True,
        phone=phone,
        email=email,
        avatar_url=None,
    )
    session.add(user)
    session.flush()
    return user


def save_field_user_avatar(
    session: Session,
    *,
    user_id: str,
    original_filename: str | None,
    content: bytes,
) -> User:
    user = session.scalar(select(User).where(User.id == user_id, User.login != "system"))
    if user is None:
        raise ValueError("User not found")

    if not content:
        raise ValueError("Avatar file is empty")
    if len(content) > MAX_AVATAR_BYTES:
        raise ValueError("Avatar file is too large")

    suffix = Path(original_filename or "").suffix.lower()
    if suffix not in ALLOWED_AVATAR_EXTENSIONS:
        raise ValueError("Unsupported avatar file type")

    USER_AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    if user.avatar_url and user.avatar_url.startswith("/static/uploads/user-avatars/"):
        previous_file = USER_AVATAR_DIR / user.avatar_url.rsplit("/", 1)[-1]
        if previous_file.exists():
            previous_file.unlink()

    file_name = f"{user_id}-{uuid4().hex}{suffix}"
    target_path = USER_AVATAR_DIR / file_name
    target_path.write_bytes(content)
    user.avatar_url = f"/static/uploads/user-avatars/{file_name}"
    session.flush()
    return user


def update_field_user(
    session: Session,
    *,
    user_id: str,
    login: str | None = None,
    password: str | None = None,
    last_name: str | None = None,
    first_name: str | None = None,
    middle_name: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    role: UserRole | None = None,
) -> User:
    user = session.scalar(select(User).where(User.id == user_id, User.login != "system"))
    if user is None:
        raise ValueError("User not found")

    if login and login != user.login:
        existing = session.scalar(select(User).where(User.login == login, User.id != user_id))
        if existing is not None:
            raise ValueError("User with this login already exists")
        user.login = login
    if email and email.lower() != (user.email or "").lower():
        existing_email = session.scalar(
            select(User).where(func.lower(User.email) == email.lower(), User.id != user_id)
        )
        if existing_email is not None:
            raise ValueError("User with this email already exists")

    if password:
        user.password_hash = password
    if last_name is not None:
        user.last_name = last_name
    if first_name is not None:
        user.first_name = first_name
    if middle_name is not None:
        user.middle_name = middle_name or None
    if phone is not None:
        user.phone = phone or None
    if email is not None:
        user.email = email or None
    if role is not None:
        user.role = role

    user.full_name = " ".join(part for part in [user.last_name, user.first_name, user.middle_name] if part)
    session.flush()
    return user


def deactivate_field_user(session: Session, *, user_id: str) -> None:
    user = session.scalar(select(User).where(User.id == user_id, User.login != "system"))
    if user is None:
        raise ValueError("User not found")

    user.is_active = False
    now = datetime.now(timezone.utc)
    active_assignments = session.execute(
        select(UserAssignment).where(UserAssignment.user_id == user_id, UserAssignment.ended_at.is_(None))
    ).scalars().all()
    for assignment in active_assignments:
        assignment.ended_at = now

    active_memberships = session.execute(
        select(UserTeamMembership).where(UserTeamMembership.user_id == user_id, UserTeamMembership.ended_at.is_(None))
    ).scalars().all()
    affected_team_ids = {str(membership.team_id) for membership in active_memberships}
    for membership in active_memberships:
        membership.ended_at = now

    _cleanup_small_teams(session, team_ids=affected_team_ids, create_conflicts=False)

    session.flush()


def reactivate_field_user(session: Session, *, user_id: str) -> User:
    user = session.scalar(select(User).where(User.id == user_id, User.login != "system"))
    if user is None:
        raise ValueError("User not found")

    user.is_active = True
    session.flush()
    return user


def authenticate_field_user(session: Session, *, login: str, password: str) -> User:
    user = session.scalar(select(User).where(User.login == login, User.role == UserRole.OPERATOR))
    if user is None or not user.is_active:
        raise ValueError("User not found or inactive")
    if user.password_hash != password:
        raise ValueError("Invalid password")
    return user


def authenticate_any_user(session: Session, *, login: str, password: str) -> User:
    user = session.scalar(select(User).where(User.login == login, User.login != "system"))
    if user is None or not user.is_active:
        raise ValueError("User not found or inactive")
    if user.password_hash != password:
        raise ValueError("Invalid password")
    return user


def build_user_assignment_options(session: Session, *, user_id: str, plan_version_id: str | None = None) -> dict:
    effective_plan_version_id = get_effective_plan_version_id(session, plan_version_id)
    rooms = list_rooms_with_counts(session, plan_version_id=effective_plan_version_id)
    active_assignments = session.execute(
        select(UserAssignment).where(UserAssignment.user_id == user_id, UserAssignment.ended_at.is_(None))
    ).scalars().all()

    selected_floor_ids = [str(row.floor_id) for row in active_assignments if row.floor_id and row.department_id is None and row.room_id is None]
    selected_department_ids = [str(row.department_id) for row in active_assignments if row.department_id and row.room_id is None]
    selected_room_ids = [str(row.room_id) for row in active_assignments if row.room_id]
    room_counts_map = {row["room_id"]: int(row.get("planned_items_count", 0) or 0) for row in rooms}

    room_meta = {
        row["room_id"]: {
            "floor_id": None,
            "floor_code": row["floor_code"],
            "floor_name": row["floor_code"],
            "department_id": None,
            "department_name": row["department_name"],
            "room_code": row["room_code"],
            "room_name": row["room_name"],
        }
        for row in rooms
    }

    floor_ids = {str(row.id): row for row in session.execute(select(Floor)).scalars()}
    department_ids = {str(row.id): row for row in session.execute(select(Department)).scalars()}
    room_rows = session.execute(select(Room.id, Room.floor_id, Room.department_id)).all()
    for room_id, floor_id, department_id in room_rows:
        key = str(room_id)
        if key in room_meta:
            room_meta[key]["floor_id"] = str(floor_id) if floor_id else None
            room_meta[key]["department_id"] = str(department_id) if department_id else None
            if floor_id and str(floor_id) in floor_ids:
                room_meta[key]["floor_name"] = floor_ids[str(floor_id)].name
            if department_id and str(department_id) in department_ids:
                room_meta[key]["department_name"] = department_ids[str(department_id)].name

    selected_room_set = set(selected_room_ids)
    progress_user_ids = get_progress_user_ids_for_user(session, user_id=user_id)
    completed_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(DomainEvent.aggregate_id)).where(
                DomainEvent.event_type == "room.check_completed",
                DomainEvent.aggregate_type == "room",
                DomainEvent.user_id.in_(progress_user_ids),
            )
        ).scalars().all()
    }
    started_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(ItemCheck.room_id)).where(ItemCheck.created_by.in_(progress_user_ids))
        ).scalars().all()
    }
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
    checked_items_count_map = {
        str(room_id): int(count or 0)
        for room_id, count in session.execute(
            select(ItemCheck.room_id, func.count(ItemCheck.id))
            .where(ItemCheck.created_by.in_(progress_user_ids))
            .group_by(ItemCheck.room_id)
        ).all()
    }

    floor_map: dict[str, dict] = {}
    for room_id, meta in room_meta.items():
        floor_key = meta["floor_id"] or "no-floor"
        floor_entry = floor_map.setdefault(
            floor_key,
            {
                "floor_id": meta["floor_id"],
                "floor_code": meta["floor_code"],
                "floor_name": meta["floor_name"],
                "selected": meta["floor_id"] in selected_floor_ids,
                "departments": {},
            },
        )
        department_key = meta["department_id"] or f"no-dept-{floor_key}"
        department_entry = floor_entry["departments"].setdefault(
            department_key,
            {
                "department_id": meta["department_id"],
                "department_name": meta["department_name"],
                "selected": meta["department_id"] in selected_department_ids,
                "rooms": [],
            },
        )
        department_entry["rooms"].append(
            {
                "room_id": room_id,
                "room_code": meta["room_code"],
                "room_name": meta["room_name"],
                "selected": room_id in selected_room_ids,
                "progress_status": _get_room_progress_status(
                    room_id,
                    selected_room_set=selected_room_set,
                    completed_room_ids=completed_room_ids,
                    started_room_ids=started_room_ids,
                ),
                "checked_items_count": checked_items_count_map.get(room_id, 0),
                "total_items_count": room_counts_map.get(room_id, 0),
                "completed_at": completed_at_map.get(room_id),
                "repeat_check_required": completed_at_map.get(room_id) is not None,
            }
        )

    floors = []
    for floor_entry in floor_map.values():
        departments = []
        for department_entry in floor_entry["departments"].values():
            department_entry["rooms"].sort(key=lambda room: room["room_code"] or "")
            assigned_rooms_count = sum(1 for room in department_entry["rooms"] if room["selected"])
            completed_rooms_count = sum(
                1 for room in department_entry["rooms"] if room["selected"] and room["progress_status"] == "completed"
            )
            in_progress_rooms_count = sum(
                1 for room in department_entry["rooms"] if room["selected"] and room["progress_status"] == "in_progress"
            )
            not_started_rooms_count = sum(
                1 for room in department_entry["rooms"] if room["selected"] and room["progress_status"] == "not_started"
            )
            department_entry["assigned_rooms_count"] = assigned_rooms_count
            department_entry["completed_rooms_count"] = completed_rooms_count
            department_entry["in_progress_rooms_count"] = in_progress_rooms_count
            department_entry["not_started_rooms_count"] = not_started_rooms_count
            department_entry["progress_status"] = _summarize_progress_status(
                assigned_rooms_count=assigned_rooms_count,
                completed_rooms_count=completed_rooms_count,
                in_progress_rooms_count=in_progress_rooms_count,
            )
            departments.append(department_entry)
        departments.sort(key=lambda department: department["department_name"] or "")
        assigned_rooms_count = sum(department["assigned_rooms_count"] for department in departments)
        completed_rooms_count = sum(department["completed_rooms_count"] for department in departments)
        in_progress_rooms_count = sum(department["in_progress_rooms_count"] for department in departments)
        not_started_rooms_count = sum(department["not_started_rooms_count"] for department in departments)
        floors.append(
            {
                "floor_id": floor_entry["floor_id"],
                "floor_code": floor_entry["floor_code"],
                "floor_name": floor_entry["floor_name"],
                "selected": floor_entry["selected"],
                "progress_status": _summarize_progress_status(
                    assigned_rooms_count=assigned_rooms_count,
                    completed_rooms_count=completed_rooms_count,
                    in_progress_rooms_count=in_progress_rooms_count,
                ),
                "assigned_rooms_count": assigned_rooms_count,
                "completed_rooms_count": completed_rooms_count,
                "in_progress_rooms_count": in_progress_rooms_count,
                "not_started_rooms_count": not_started_rooms_count,
                "departments": departments,
            }
        )

    floors.sort(key=lambda floor: floor["floor_code"] or "")
    progress_summary = {
        "assigned_rooms_count": sum(floor["assigned_rooms_count"] for floor in floors),
        "completed_rooms_count": sum(floor["completed_rooms_count"] for floor in floors),
        "in_progress_rooms_count": sum(floor["in_progress_rooms_count"] for floor in floors),
        "not_started_rooms_count": sum(floor["not_started_rooms_count"] for floor in floors),
    }
    return {
        "user_id": user_id,
        "plan_version_id": effective_plan_version_id,
        "floors": floors,
        "selected_floor_ids": selected_floor_ids,
        "selected_department_ids": selected_department_ids,
        "selected_room_ids": selected_room_ids,
        "progress_summary": progress_summary,
    }


def _get_room_progress_status(
    room_id: str,
    *,
    selected_room_set: set[str],
    completed_room_ids: set[str],
    started_room_ids: set[str],
) -> str:
    if room_id not in selected_room_set:
        return "not_assigned"
    if room_id in completed_room_ids:
        return "completed"
    if room_id in started_room_ids:
        return "in_progress"
    return "not_started"


def _summarize_progress_status(
    *,
    assigned_rooms_count: int,
    completed_rooms_count: int,
    in_progress_rooms_count: int,
) -> str:
    if assigned_rooms_count == 0:
        return "not_assigned"
    if completed_rooms_count == assigned_rooms_count:
        return "completed"
    if completed_rooms_count > 0 or in_progress_rooms_count > 0:
        return "in_progress"
    return "not_started"


def _get_user_progress_summary(session: Session, *, user_id: str) -> dict:
    assigned_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(UserAssignment.room_id)).where(
                UserAssignment.user_id == user_id,
                UserAssignment.ended_at.is_(None),
                UserAssignment.room_id.is_not(None),
            )
        ).scalars().all()
    }
    progress_user_ids = get_progress_user_ids_for_user(session, user_id=user_id)
    completed_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(DomainEvent.aggregate_id)).where(
                DomainEvent.event_type == "room.check_completed",
                DomainEvent.aggregate_type == "room",
                DomainEvent.user_id.in_(progress_user_ids),
            )
        ).scalars().all()
    }
    started_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(ItemCheck.room_id)).where(ItemCheck.created_by.in_(progress_user_ids))
        ).scalars().all()
    }

    assigned_count = len(assigned_room_ids)
    completed_count = sum(1 for room_id in assigned_room_ids if room_id in completed_room_ids)
    in_progress_count = sum(
        1 for room_id in assigned_room_ids if room_id not in completed_room_ids and room_id in started_room_ids
    )
    not_started_count = max(0, assigned_count - completed_count - in_progress_count)

    if assigned_count == 0 or completed_count == assigned_count:
        work_status = "available"
    elif completed_count > 0 or in_progress_count > 0:
        work_status = "in_progress"
    else:
        work_status = "idle"

    return {
        "assigned_rooms_count": assigned_count,
        "completed_rooms_count": completed_count,
        "in_progress_rooms_count": in_progress_count,
        "not_started_rooms_count": not_started_count,
        "work_status": work_status,
    }


def _normalize_member_ids(session: Session, member_user_ids: list[str]) -> list[str]:
    normalized = sorted({member_id for member_id in member_user_ids if member_id})
    users = {
        str(user.id): user
        for user in session.execute(
            select(User).where(
                User.id.in_(normalized),
                User.role == UserRole.OPERATOR,
                User.is_active.is_(True),
            )
        ).scalars()
    }
    return [member_id for member_id in normalized if member_id in users]


def _build_default_team_name(session: Session, member_user_ids: list[str]) -> str:
    users = session.execute(select(User).where(User.id.in_(member_user_ids)).order_by(User.full_name.asc())).scalars().all()
    names = [user.last_name or user.full_name for user in users[:2]]
    if len(users) > 2:
        return f"Группа {' / '.join(names)} +{len(users) - 2}"
    return f"Группа {' / '.join(names)}"


def _set_team_memberships(session: Session, *, team_id: str, member_user_ids: list[str]) -> None:
    now = datetime.now(timezone.utc)
    current_team_memberships = session.execute(
        select(UserTeamMembership).where(
            UserTeamMembership.team_id == team_id,
            UserTeamMembership.ended_at.is_(None),
        )
    ).scalars().all()
    for membership in current_team_memberships:
        membership.ended_at = now

    if member_user_ids:
        current_memberships = session.execute(
            select(UserTeamMembership).where(
                UserTeamMembership.user_id.in_(member_user_ids),
                UserTeamMembership.ended_at.is_(None),
            )
        ).scalars().all()
    else:
        current_memberships = []
    for membership in current_memberships:
        membership.ended_at = now

    for member_user_id in member_user_ids:
        session.add(
            UserTeamMembership(
                user_id=member_user_id,
                team_id=team_id,
                started_at=now,
            )
        )


def _disband_team(session: Session, *, team: Team) -> None:
    now = datetime.now(timezone.utc)
    team.is_active = False
    memberships = session.execute(
        select(UserTeamMembership).where(
            UserTeamMembership.team_id == team.id,
            UserTeamMembership.ended_at.is_(None),
        )
    ).scalars().all()
    for membership in memberships:
        membership.ended_at = now


def _cleanup_small_teams(session: Session, *, team_ids: set[str] | None = None, create_conflicts: bool = False) -> None:
    stmt = select(Team).where(Team.is_active.is_(True))
    if team_ids:
        stmt = stmt.where(Team.id.in_(team_ids))
    teams = session.execute(stmt).scalars().all()
    for team in teams:
        active_member_count = session.scalar(
            select(func.count(UserTeamMembership.id)).where(
                UserTeamMembership.team_id == team.id,
                UserTeamMembership.ended_at.is_(None),
            )
        ) or 0
        if active_member_count < 2:
            if create_conflicts:
                _create_team_overlap_conflicts(session, team=team)
            _disband_team(session, team=team)


def _build_team_summary(session: Session, *, team: Team) -> dict:
    memberships = session.execute(
        select(UserTeamMembership, User)
        .join(User, User.id == UserTeamMembership.user_id)
        .where(UserTeamMembership.team_id == team.id, UserTeamMembership.ended_at.is_(None))
        .order_by(User.full_name.asc())
    ).all()
    member_ids = [str(user.id) for _, user in memberships]
    members = [
        {
            "user_id": str(user.id),
            "full_name": user.full_name,
            "login": user.login,
        }
        for _, user in memberships
    ]

    assigned_room_sets: list[set[str]] = []
    for member_id in member_ids:
        member_room_ids = {
            str(room_id)
            for room_id in session.execute(
                select(distinct(UserAssignment.room_id)).where(
                    UserAssignment.user_id == member_id,
                    UserAssignment.ended_at.is_(None),
                    UserAssignment.room_id.is_not(None),
                )
            ).scalars().all()
        }
        assigned_room_sets.append(member_room_ids)
    assigned_room_ids = set.intersection(*assigned_room_sets) if assigned_room_sets else set()
    completed_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(DomainEvent.aggregate_id)).where(
                DomainEvent.event_type == "room.check_completed",
                DomainEvent.aggregate_type == "room",
                DomainEvent.user_id.in_(member_ids),
            )
        ).scalars().all()
    }
    started_room_ids = {
        str(room_id)
        for room_id in session.execute(
            select(distinct(ItemCheck.room_id)).where(ItemCheck.created_by.in_(member_ids))
        ).scalars().all()
    }

    completed_count = sum(1 for room_id in assigned_room_ids if room_id in completed_room_ids)
    in_progress_count = sum(
        1 for room_id in assigned_room_ids if room_id not in completed_room_ids and room_id in started_room_ids
    )
    not_started_count = max(0, len(assigned_room_ids) - completed_count - in_progress_count)

    return {
        "team_id": str(team.id),
        "team_name": team.name,
        "members_count": len(members),
        "assigned_rooms_count": len(assigned_room_ids),
        "completed_rooms_count": completed_count,
        "in_progress_rooms_count": in_progress_count,
        "not_started_rooms_count": not_started_count,
        "members": members,
    }


def _create_team_overlap_conflicts(session: Session, *, team: Team) -> int:
    memberships = session.execute(
        select(UserTeamMembership.user_id).where(
            UserTeamMembership.team_id == team.id,
            UserTeamMembership.ended_at.is_(None),
        )
    ).scalars().all()
    member_ids = [str(member_id) for member_id in memberships]
    if len(member_ids) < 2:
        return 0

    rows = session.execute(
        select(UserAssignment.room_id, func.count(distinct(UserAssignment.user_id)))
        .where(
            UserAssignment.user_id.in_(member_ids),
            UserAssignment.ended_at.is_(None),
            UserAssignment.room_id.is_not(None),
        )
        .group_by(UserAssignment.room_id)
        .having(func.count(distinct(UserAssignment.user_id)) > 1)
    ).all()
    overlap_room_ids = [str(room_id) for room_id, _ in rows if room_id]
    if not overlap_room_ids:
        return 0

    created_count = 0
    for room_id in overlap_room_ids:
        existing = session.scalar(
            select(Conflict.id).where(
                Conflict.room_id == room_id,
                Conflict.conflict_type == ConflictType.PARALLEL_ROOM_ACTIVITY,
                Conflict.status_code == ConflictStatus.OPEN,
            )
        )
        if existing is not None:
            continue

        event = DomainEvent(
            event_uid=f"team-disband-{team.id}-{room_id}-{uuid4().hex}",
            event_type="team.disbanded",
            aggregate_type="team",
            aggregate_id=team.id,
            user_id=None,
            device_id=None,
            sync_batch_id=None,
            occurred_at_device=None,
            payload_json={
                "team_id": str(team.id),
                "team_name": team.name,
                "room_id": room_id,
                "member_user_ids": member_ids,
            },
            metadata_json={"source": "group_management"},
        )
        session.add(event)
        session.flush()

        session.add(
            Conflict(
                conflict_type=ConflictType.PARALLEL_ROOM_ACTIVITY,
                room_id=room_id,
                equipment_instance_id=None,
                first_event_id=event.id,
                second_event_id=event.id,
                status_code=ConflictStatus.OPEN,
            )
        )
        created_count += 1

    return created_count


def replace_user_assignments(
    session: Session,
    *,
    user_id: str,
    room_ids: list[str],
    department_ids: list[str],
    floor_ids: list[str],
    created_by,
) -> int:
    now = datetime.now(timezone.utc)
    active_assignments = session.execute(
        select(UserAssignment).where(UserAssignment.user_id == user_id, UserAssignment.ended_at.is_(None))
    ).scalars().all()
    for assignment in active_assignments:
        assignment.ended_at = now

    room_rows = {
        str(row.id): row
        for row in session.execute(select(Room)).scalars()
    }
    count = 0

    for room_id in sorted(set(room_ids)):
        room = room_rows.get(room_id)
        if room is None:
            continue
        session.add(
            UserAssignment(
                user_id=user_id,
                building_id=room.building_id,
                floor_id=room.floor_id,
                department_id=room.department_id,
                room_id=room.id,
                created_by=created_by,
            )
        )
        count += 1

    for department_id in sorted(set(department_ids)):
        department = session.scalar(select(Department).where(Department.id == department_id))
        if department is None:
            continue
        session.add(
            UserAssignment(
                user_id=user_id,
                building_id=department.building_id,
                department_id=department.id,
                created_by=created_by,
            )
        )
        count += 1

    for floor_id in sorted(set(floor_ids)):
        floor = session.scalar(select(Floor).where(Floor.id == floor_id))
        if floor is None:
            continue
        session.add(
            UserAssignment(
                user_id=user_id,
                building_id=floor.building_id,
                floor_id=floor.id,
                created_by=created_by,
            )
        )
        count += 1

    session.flush()
    return count


def create_field_login_payload(
    session: Session,
    *,
    login: str,
    password: str,
    device_uid: str,
    platform: str,
    app_version: str | None,
) -> dict:
    user = authenticate_field_user(session, login=login, password=password)
    device = get_or_create_device(
        session,
        user_id=user.id,
        device_uid=device_uid,
        platform=platform,
        app_version=app_version,
    )
    return {
        "user_id": str(user.id),
        "login": user.login,
        "full_name": user.full_name,
        "role": user.role.value,
        "device_id": str(device.id),
        "device_uid": device.device_uid,
        "platform": device.platform,
        "app_version": device.app_version,
        "last_seen_at": device.last_seen_at,
    }
