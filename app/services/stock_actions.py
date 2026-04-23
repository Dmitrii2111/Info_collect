from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.org import Room
from app.models.stock import StorageZone
from app.services.stock_queries import get_default_building_id


def create_storage_zone(
    db: Session,
    *,
    code: str,
    name: str,
    room_id: str | None,
    created_by: str,
) -> StorageZone:
    normalized_code = code.strip()
    normalized_name = name.strip()
    if not normalized_code or not normalized_name:
        raise ValueError("Storage zone code and name are required.")

    building_id = None
    if room_id:
        room = db.execute(select(Room).where(Room.id == room_id)).scalar_one_or_none()
        if room is None:
            raise ValueError("Room not found for storage zone.")
        building_id = str(room.building_id)

    if building_id is None:
        building_id = get_default_building_id(db)

    if building_id is None:
        raise ValueError("No active building found for storage zone.")

    existing = db.execute(
        select(StorageZone).where(
            StorageZone.building_id == building_id,
            StorageZone.code == normalized_code,
        ),
    ).scalar_one_or_none()
    if existing is not None:
        raise ValueError("Storage zone with this code already exists.")

    zone = StorageZone(
        building_id=building_id,
        code=normalized_code,
        name=normalized_name,
        room_id=room_id,
        created_by=created_by,
    )
    db.add(zone)
    db.flush()
    return zone
