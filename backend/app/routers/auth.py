from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.crud.staff import get_by_username
from app.db.session import get_db
from app.schemas.staff import LoginRequest, LoginResponse, StaffOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    staff = get_by_username(db, data.username)
    if staff is None or not verify_password(data.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
        )

    token = create_access_token(staff_id=staff.id, role=staff.role.value, name=staff.name)
    return LoginResponse(access_token=token, staff=StaffOut.model_validate(staff))
