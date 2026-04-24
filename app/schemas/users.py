from datetime import datetime

from pydantic import BaseModel, Field


class FieldUserListItem(BaseModel):
    user_id: str
    login: str
    full_name: str
    last_name: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    role: str
    is_active: bool
    phone: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    active_assignments_count: int = 0
    assigned_rooms_count: int = 0
    completed_rooms_count: int = 0
    in_progress_rooms_count: int = 0
    not_started_rooms_count: int = 0
    work_status: str = "available"


class FieldUserCreateRequest(BaseModel):
    login: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=3, max_length=200)
    last_name: str = Field(min_length=1, max_length=120)
    first_name: str = Field(min_length=1, max_length=120)
    middle_name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=120)
    role: str = Field(default="field_worker", max_length=40)


class FieldUserResponse(BaseModel):
    user_id: str
    login: str
    full_name: str
    last_name: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    role: str
    phone: str | None = None
    email: str | None = None
    avatar_url: str | None = None


class FieldUserUpdateRequest(BaseModel):
    login: str | None = Field(default=None, min_length=3, max_length=100)
    password: str | None = Field(default=None, min_length=3, max_length=200)
    last_name: str | None = Field(default=None, min_length=1, max_length=120)
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    middle_name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=120)
    role: str | None = Field(default=None, max_length=40)


class AssignmentOptionRoom(BaseModel):
    room_id: str
    room_code: str
    room_name: str
    selected: bool = False
    progress_status: str = "not_assigned"
    checked_items_count: int = 0
    total_items_count: int = 0
    completed_at: datetime | None = None
    repeat_check_required: bool = False


class AssignmentOptionDepartment(BaseModel):
    department_id: str | None = None
    department_name: str | None = None
    selected: bool = False
    progress_status: str = "not_assigned"
    assigned_rooms_count: int = 0
    completed_rooms_count: int = 0
    in_progress_rooms_count: int = 0
    not_started_rooms_count: int = 0
    rooms: list[AssignmentOptionRoom]


class AssignmentOptionFloor(BaseModel):
    floor_id: str | None = None
    floor_code: str | None = None
    floor_name: str | None = None
    selected: bool = False
    progress_status: str = "not_assigned"
    assigned_rooms_count: int = 0
    completed_rooms_count: int = 0
    in_progress_rooms_count: int = 0
    not_started_rooms_count: int = 0
    departments: list[AssignmentOptionDepartment]


class AssignmentProgressSummary(BaseModel):
    assigned_rooms_count: int = 0
    completed_rooms_count: int = 0
    in_progress_rooms_count: int = 0
    not_started_rooms_count: int = 0


class UserAssignmentOptionsResponse(BaseModel):
    user_id: str
    plan_version_id: str | None = None
    floors: list[AssignmentOptionFloor]
    selected_floor_ids: list[str]
    selected_department_ids: list[str]
    selected_room_ids: list[str]
    progress_summary: AssignmentProgressSummary = AssignmentProgressSummary()


class UserAssignmentsUpdateRequest(BaseModel):
    floor_ids: list[str] = []
    department_ids: list[str] = []
    room_ids: list[str] = []


class UserAssignmentsUpdateResponse(BaseModel):
    message: str
    user_id: str
    updated_at: datetime
    active_assignments_count: int


class AssignmentOverlapEntry(BaseModel):
    room_id: str
    room_code: str
    room_name: str
    other_user_id: str
    other_user_name: str
    other_group_id: str | None = None
    other_group_name: str | None = None


class AssignmentOverlapResponse(BaseModel):
    user_id: str
    overlap_count: int = 0
    overlaps: list[AssignmentOverlapEntry]


class TeamMemberInfo(BaseModel):
    user_id: str
    full_name: str
    login: str


class TeamSummary(BaseModel):
    team_id: str
    team_name: str
    members_count: int
    assigned_rooms_count: int = 0
    completed_rooms_count: int = 0
    in_progress_rooms_count: int = 0
    not_started_rooms_count: int = 0
    members: list[TeamMemberInfo]


class TeamCreateRequest(BaseModel):
    team_name: str = Field(min_length=1, max_length=150)
    member_user_ids: list[str] = []


class TeamResponse(BaseModel):
    team_id: str
    team_name: str
    members: list[TeamMemberInfo]


class TeamUpdateRequest(BaseModel):
    team_name: str = Field(min_length=1, max_length=150)
    member_user_ids: list[str] = []


class TeamDeleteResponse(BaseModel):
    message: str
    team_id: str
    conflicts_created: int = 0
    disbanded_to_user_id: str | None = None


class TeamMergeRequest(BaseModel):
    primary_user_id: str
    other_user_ids: list[str]
    team_name: str | None = Field(default=None, max_length=150)


class FieldLoginRequest(BaseModel):
    login: str
    password: str
    device_uid: str
    platform: str
    app_version: str | None = None


class FieldLoginResponse(BaseModel):
    user_id: str
    login: str
    full_name: str
    role: str
    device_id: str
    device_uid: str
    platform: str
    app_version: str | None = None
    last_seen_at: datetime | None = None


class AuthLoginRequest(BaseModel):
    login: str
    password: str


class AuthLoginResponse(BaseModel):
    user_id: str
    login: str
    full_name: str
    last_name: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    role: str
    phone: str | None = None
    email: str | None = None
    avatar_url: str | None = None
