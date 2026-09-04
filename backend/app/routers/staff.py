from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.staff import create_staff, delete_staff, get_by_username, list_staff
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import Staff, StaffRole
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


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    admin: Staff = Depends(require_role([StaffRole.admin])),
) -> None:
    staff = db.get(Staff, staff_id)
    if staff is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
    if staff.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode remover a si mesmo")
    delete_staff(db, staff)