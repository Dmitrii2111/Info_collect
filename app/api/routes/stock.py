from fastapi import APIRouter

from app.schemas.common import MessageResponse


router = APIRouter()


@router.get("/receipts", response_model=list[dict])
def list_receipts() -> list[dict]:
    return []


@router.get("/zones", response_model=list[dict])
def list_storage_zones() -> list[dict]:
    return []


@router.post("/receipts/import", response_model=MessageResponse)
def import_receipt() -> MessageResponse:
    return MessageResponse(message="Warehouse import endpoint scaffold is ready.")
