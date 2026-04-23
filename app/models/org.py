from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import CategoryCode, UserRole
from app.models.sqltypes import enum_column


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    login: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(enum_column(UserRole, "user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    avatar_url: Mapped[str | None] = mapped_column(String)


class Team(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String, nullable=False)
    category_scope: Mapped[CategoryCode | None] = mapped_column(enum_column(CategoryCode, "category_code"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserTeamMembership(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "user_team_memberships"
    __table_args__ = (UniqueConstraint("user_id", "team_id", "started_at", name="uq_user_team_membership"),)

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Building(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "buildings"

    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Floor(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "floors"
    __table_args__ = (UniqueConstraint("building_id", "code", name="uq_floor_code_per_building"),)

    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Department(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "departments"
    __table_args__ = (UniqueConstraint("building_id", "name", name="uq_department_name_per_building"),)

    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Room(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "rooms"
    __table_args__ = (UniqueConstraint("building_id", "room_code", name="uq_room_code_per_building"),)

    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    floor_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("floors.id"))
    department_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"))
    room_code: Mapped[str] = mapped_column(String, nullable=False)
    room_name: Mapped[str] = mapped_column(String, nullable=False)
    room_type: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class UserAssignment(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "user_assignments"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("teams.id"))
    building_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False)
    floor_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("floors.id"))
    department_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"))
    room_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    category_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment_categories.id"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class Device(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "devices"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    platform: Mapped[str] = mapped_column(String, nullable=False)
    app_version: Mapped[str | None] = mapped_column(String)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
