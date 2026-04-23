from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.users import AuthLoginRequest, AuthLoginResponse
from app.services.user_admin import authenticate_any_user


router = APIRouter()


@router.post("/login", response_model=AuthLoginResponse)
def auth_login(payload: AuthLoginRequest, db: Session = Depends(get_db)) -> AuthLoginResponse:
    try:
        user = authenticate_any_user(db, login=payload.login.strip(), password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return AuthLoginResponse(
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
