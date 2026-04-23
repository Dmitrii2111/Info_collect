from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from app.services.sync_actions import process_sync_batch


router = APIRouter()


@router.post("/batches", response_model=SyncBatchResponse)
def register_sync_batch(payload: SyncBatchRequest, db: Session = Depends(get_db)) -> SyncBatchResponse:
    try:
        result = process_sync_batch(db, payload)
        db.commit()
    except Exception as exc:  # pragma: no cover
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sync batch failed: {exc}") from exc

    return SyncBatchResponse(**result)
