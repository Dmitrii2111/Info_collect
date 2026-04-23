from fastapi import APIRouter

from app.api.routes import auth, field, health, items, plans, rooms, stock, sync, users


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(field.router, prefix="/field", tags=["field"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(stock.router, prefix="/stock", tags=["stock"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
