from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.schemas.changes import (
    PlanChangeActionResponse,
    PlanChangeItemUpdateRequest,
    PlanChangeSetDetail,
    PlanChangeSetListItem,
)
from app.schemas.plan_views import PlanVersionListItem
from app.schemas.plans import PlanImportRequest, PlanImportResponse, PlanImportSummary, PlanVersionResponse
from app.db.session import get_db
from app.models.org import Building
from app.models.enums import CategoryCode, ChangeResolutionAction, ChangeResolutionStatus
from app.models.plan import PlannedItem, PlannedPosition, PlanVersion
from app.services.change_actions import apply_change_set, approve_change_set, update_change_item
from app.services.change_queries import get_change_set_detail, list_change_sets
from app.services.plan_import import import_plan_from_excel
from app.services.system_user import get_or_create_system_user


router = APIRouter()


@router.get("/versions", response_model=list[PlanVersionListItem])
def list_plan_versions(db: Session = Depends(get_db)) -> list[PlanVersionListItem]:
    rows = db.execute(
        select(
            PlanVersion.id,
            Building.code.label("building_code"),
            PlanVersion.version_no,
            PlanVersion.version_label,
            PlanVersion.status_code,
            PlanVersion.source_file_name,
            PlanVersion.created_at,
            PlanVersion.applied_at,
            PlanVersion.comment_text,
            func.count(func.distinct(PlannedPosition.id)).label("planned_positions_count"),
            func.count(func.distinct(PlannedItem.id)).label("planned_items_count"),
        )
        .select_from(PlanVersion)
        .join(Building, Building.id == PlanVersion.building_id)
        .outerjoin(PlannedPosition, PlannedPosition.plan_version_id == PlanVersion.id)
        .outerjoin(PlannedItem, PlannedItem.planned_position_id == PlannedPosition.id)
        .group_by(
            PlanVersion.id,
            Building.code,
            PlanVersion.version_no,
            PlanVersion.version_label,
            PlanVersion.status_code,
            PlanVersion.source_file_name,
            PlanVersion.created_at,
            PlanVersion.applied_at,
            PlanVersion.comment_text,
        )
        .order_by(PlanVersion.created_at.desc())
    ).all()

    return [
        PlanVersionListItem(
            id=str(row.id),
            building_code=row.building_code,
            version_no=row.version_no,
            version_label=row.version_label,
            status=row.status_code.value,
            source_file_name=row.source_file_name,
            created_at=row.created_at,
            applied_at=row.applied_at,
            comment_text=row.comment_text,
            planned_positions_count=int(row.planned_positions_count or 0),
            planned_items_count=int(row.planned_items_count or 0),
        )
        for row in rows
    ]


@router.post("/import/local", response_model=PlanImportResponse, status_code=status.HTTP_201_CREATED)
def import_plan_local(payload: PlanImportRequest, db: Session = Depends(get_db)) -> PlanImportResponse:
    system_user = get_or_create_system_user(db)

    try:
        category_code = CategoryCode(payload.category_code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Unsupported category_code: {payload.category_code}") from exc

    try:
        result = import_plan_from_excel(
            db,
            source_path=payload.source_path,
            building_code=payload.building_code,
            building_name=payload.building_name,
            version_label=payload.version_label,
            category_code=category_code,
            comment_text=payload.comment_text,
            created_by_id=system_user.id,
        )
        db.commit()
    except FileNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive API boundary
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {exc}") from exc

    building = db.scalar(select(Building).where(Building.id == result.plan_version.building_id))
    return PlanImportResponse(
        import_session_id=str(result.import_session.id),
        plan_version=PlanVersionResponse(
            id=str(result.plan_version.id),
            building_code=building.code if building else payload.building_code,
            version_no=result.plan_version.version_no,
            version_label=result.plan_version.version_label,
            status=result.plan_version.status_code.value,
            source_file_name=result.plan_version.source_file_name,
            created_at=result.plan_version.created_at,
            applied_at=result.plan_version.applied_at,
            comment_text=result.plan_version.comment_text,
        ),
        summary=PlanImportSummary(
            imported_rooms=result.imported_rooms,
            imported_positions=result.imported_positions,
            imported_items=result.imported_items,
            detected_changes=result.detected_changes,
            change_set_id=result.change_set_id,
        ),
    )


@router.get("/changesets", response_model=list[PlanChangeSetListItem])
def get_plan_change_sets(db: Session = Depends(get_db)) -> list[PlanChangeSetListItem]:
    rows = list_change_sets(db)
    return [PlanChangeSetListItem(**row) for row in rows]


@router.get("/changesets/{change_set_id}", response_model=PlanChangeSetDetail)
def get_plan_change_set_detail(change_set_id: str, db: Session = Depends(get_db)) -> PlanChangeSetDetail:
    payload = get_change_set_detail(db, change_set_id)
    if payload is None:
        raise HTTPException(status_code=404, detail=f"Change set not found: {change_set_id}")
    return PlanChangeSetDetail(**payload)


@router.patch("/changesets/{change_set_id}/items/{item_id}", response_model=PlanChangeActionResponse)
def update_plan_change_item(
    change_set_id: str,
    item_id: str,
    payload: PlanChangeItemUpdateRequest,
    db: Session = Depends(get_db),
) -> PlanChangeActionResponse:
    system_user = get_or_create_system_user(db)

    resolution_status = None
    resolution_action = None
    try:
        if payload.resolution_status is not None:
            resolution_status = ChangeResolutionStatus(payload.resolution_status)
        if payload.resolution_action is not None:
            resolution_action = ChangeResolutionAction(payload.resolution_action)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        change_set = update_change_item(
            db,
            change_set_id=change_set_id,
            item_id=item_id,
            resolution_status=resolution_status,
            resolution_action=resolution_action,
            comment_text=payload.comment_text,
            resolved_by=system_user.id,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return PlanChangeActionResponse(
        message="Change item updated",
        change_set_id=str(change_set.id),
        status=change_set.status_code.value,
    )


@router.post("/changesets/{change_set_id}/approve", response_model=PlanChangeActionResponse)
def approve_plan_change_set(change_set_id: str, db: Session = Depends(get_db)) -> PlanChangeActionResponse:
    system_user = get_or_create_system_user(db)

    try:
        change_set = approve_change_set(db, change_set_id=change_set_id, resolved_by=system_user.id)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return PlanChangeActionResponse(
        message="Change set approved",
        change_set_id=str(change_set.id),
        status=change_set.status_code.value,
    )


@router.post("/changesets/{change_set_id}/apply", response_model=PlanChangeActionResponse)
def apply_plan_change_set(change_set_id: str, db: Session = Depends(get_db)) -> PlanChangeActionResponse:
    system_user = get_or_create_system_user(db)

    try:
        change_set = apply_change_set(db, change_set_id=change_set_id, resolved_by=system_user.id)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return PlanChangeActionResponse(
        message="Change set applied",
        change_set_id=str(change_set.id),
        status=change_set.status_code.value,
    )
