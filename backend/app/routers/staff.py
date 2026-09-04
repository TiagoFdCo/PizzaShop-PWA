from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.staff import create_staff, get_by_username, list_staff
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import StaffRole
from app.schemas.staff import StaffCreate, StaffOut

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffOut])
def read_staff(
    role: StaffRole | None = None,
    db: Session = Depends(get_db),
    _staff=Depends(require_role([StaffRole.admin, StaffRole.cozinha])),
) -> list[StaffOut]:
    # cozinha precisa disso pra montar o seletor de entregador em
    # PATCH /orders/{id}/dispatch (?role=entrega); admin usa pra gerenciar a equipe.
    return [StaffOut.model_validate(s) for s in list_staff(db, role)]


@router.post("", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
def add_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_role([StaffRole.admin])),
) -> StaffOut:
    if get_by_username(db, data.username) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username já em uso")
    staff = create_staff(db, data)
    return StaffOut.model_validate(staff)
