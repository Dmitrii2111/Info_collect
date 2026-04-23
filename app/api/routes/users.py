from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import UserRole
from app.schemas.users import (
    AssignmentOverlapResponse,
    FieldUserCreateRequest,
    FieldUserListItem,
    FieldUserResponse,
    FieldUserUpdateRequest,
    TeamCreateRequest,
    TeamMergeRequest,
    TeamResponse,
    TeamSummary,
    UserAssignmentOptionsResponse,
    UserAssignmentsUpdateRequest,
    UserAssignmentsUpdateResponse,
)
from app.services.system_user import get_or_create_system_user
from app.services.user_admin import (
    build_user_assignment_options,
    build_assignment_overlap_preview,
    create_field_user,
    create_team,
    deactivate_field_user,
    get_group_detail,
    list_field_users,
    list_groups,
    merge_users_into_team,
    reactivate_field_user,
    replace_user_assignments,
    save_field_user_avatar,
    update_field_user,
)


router = APIRouter()


@router.get("/field-workers", response_model=list[FieldUserListItem])
def get_field_workers(db: Session = Depends(get_db)) -> list[FieldUserListItem]:
    return [FieldUserListItem(**row) for row in list_field_users(db)]


@router.post("/field-workers", response_model=FieldUserResponse, status_code=status.HTTP_201_CREATED)
def create_worker(payload: FieldUserCreateRequest, db: Session = Depends(get_db)) -> FieldUserResponse:
    try:
        user = create_field_user(
            db,
            login=payload.login.strip(),
            password=payload.password,
            last_name=payload.last_name.strip(),
            first_name=payload.first_name.strip(),
            middle_name=payload.middle_name.strip() if payload.middle_name else None,
            phone=payload.phone.strip() if payload.phone else None,
            email=payload.email.strip() if payload.email else None,
            role=UserRole(payload.role),
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FieldUserResponse(
        user_id=str(user.id),
        login=user.login,
        full_name=user.full_name,
        last_name=user.last_name,
        first_name=user.first_name,
        middle_name=user.middle_name,
        role=user.role.value,
        phone=user.phone,
        email=user.email,
        avatar_url=user.avatar_url,
    )


@router.put("/field-workers/{user_id}", response_model=FieldUserResponse)
def update_worker(user_id: str, payload: FieldUserUpdateRequest, db: Session = Depends(get_db)) -> FieldUserResponse:
    try:
        user = update_field_user(
            db,
            user_id=user_id,
            login=payload.login.strip() if payload.login else None,
            password=payload.password,
            last_name=payload.last_name.strip() if payload.last_name else None,
            first_name=payload.first_name.strip() if payload.first_name else None,
            middle_name=payload.middle_name.strip() if payload.middle_name else None,
            phone=payload.phone.strip() if payload.phone else None,
            email=payload.email.strip() if payload.email else None,
            role=UserRole(payload.role) if payload.role else None,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FieldUserResponse(
        user_id=str(user.id),
        login=user.login,
        full_name=user.full_name,
        last_name=user.last_name,
        first_name=user.first_name,
        middle_name=user.middle_name,
        role=user.role.value,
        phone=user.phone,
        email=user.email,
        avatar_url=user.avatar_url,
    )


@router.delete("/field-workers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(user_id: str, db: Session = Depends(get_db)) -> None:
    try:
        deactivate_field_user(db, user_id=user_id)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/field-workers/{user_id}/restore", response_model=FieldUserResponse)
def restore_worker(user_id: str, db: Session = Depends(get_db)) -> FieldUserResponse:
    try:
        user = reactivate_field_user(db, user_id=user_id)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return FieldUserResponse(
        user_id=str(user.id),
        login=user.login,
        full_name=user.full_name,
        last_name=user.last_name,
        first_name=user.first_name,
        middle_name=user.middle_name,
        role=user.role.value,
        phone=user.phone,
        email=user.email,
        avatar_url=user.avatar_url,
    )


@router.post("/field-workers/{user_id}/avatar", response_model=FieldUserResponse)
async def upload_worker_avatar(user_id: str, avatar: UploadFile = File(...), db: Session = Depends(get_db)) -> FieldUserResponse:
    try:
        content = await avatar.read()
        user = save_field_user_avatar(
            db,
            user_id=user_id,
            original_filename=avatar.filename,
            content=content,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FieldUserResponse(
        user_id=str(user.id),
        login=user.login,
        full_name=user.full_name,
        last_name=user.last_name,
        first_name=user.first_name,
        middle_name=user.middle_name,
        role=user.role.value,
        phone=user.phone,
        email=user.email,
        avatar_url=user.avatar_url,
    )


@router.get("/field-workers/{user_id}/assignments", response_model=UserAssignmentOptionsResponse)
def get_worker_assignments(user_id: str, plan_version_id: str | None = None, db: Session = Depends(get_db)) -> UserAssignmentOptionsResponse:
    payload = build_user_assignment_options(db, user_id=user_id, plan_version_id=plan_version_id)
    return UserAssignmentOptionsResponse(**payload)


@router.put("/field-workers/{user_id}/assignments", response_model=UserAssignmentsUpdateResponse)
def update_worker_assignments(
    user_id: str,
    payload: UserAssignmentsUpdateRequest,
    db: Session = Depends(get_db),
) -> UserAssignmentsUpdateResponse:
    system_user = get_or_create_system_user(db)
    count = replace_user_assignments(
        db,
        user_id=user_id,
        room_ids=payload.room_ids,
        department_ids=payload.department_ids,
        floor_ids=payload.floor_ids,
        created_by=system_user.id,
    )
    db.commit()
    return UserAssignmentsUpdateResponse(
        message="Assignments updated",
        user_id=user_id,
        updated_at=datetime.now(timezone.utc),
        active_assignments_count=count,
    )


@router.post("/field-workers/{user_id}/assignment-overlaps", response_model=AssignmentOverlapResponse)
def preview_worker_assignment_overlaps(
    user_id: str,
    payload: UserAssignmentsUpdateRequest,
    db: Session = Depends(get_db),
) -> AssignmentOverlapResponse:
    result = build_assignment_overlap_preview(db, user_id=user_id, room_ids=payload.room_ids)
    return AssignmentOverlapResponse(**result)


@router.get("/groups", response_model=list[TeamSummary])
def get_groups(db: Session = Depends(get_db)) -> list[TeamSummary]:
    return [TeamSummary(**row) for row in list_groups(db)]


@router.get("/groups/{team_id}", response_model=TeamSummary)
def get_group(team_id: str, db: Session = Depends(get_db)) -> TeamSummary:
    try:
        payload = get_group_detail(db, team_id=team_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return TeamSummary(**payload)


@router.post("/groups", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_group(payload: TeamCreateRequest, db: Session = Depends(get_db)) -> TeamResponse:
    try:
        team = create_team(db, team_name=payload.team_name, member_user_ids=payload.member_user_ids)
        db.commit()
        summary = get_group_detail(db, team_id=str(team.id))
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return TeamResponse(team_id=str(team.id), team_name=team.name, members=summary["members"])


@router.post("/groups/merge", response_model=TeamResponse)
def merge_group(payload: TeamMergeRequest, db: Session = Depends(get_db)) -> TeamResponse:
    try:
        team = merge_users_into_team(
            db,
            primary_user_id=payload.primary_user_id,
            other_user_ids=payload.other_user_ids,
            team_name=payload.team_name,
        )
        db.commit()
        summary = get_group_detail(db, team_id=str(team.id))
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return TeamResponse(team_id=str(team.id), team_name=team.name, members=summary["members"])
