"""Rotas de MESAS. Padrão de routers/orders.py."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import table as crud_table
from app.crud.table import ConflictError
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import Staff, StaffRole
from app.schemas.table import TableInput, TableOut, TableStatusInput

router = APIRouter(prefix="/tables", tags=["tables"])


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return tenant.id


@router.get("", response_model=list[TableOut])
def list_tables(
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    return crud_table.list_tables(db, _tenant_id(db))


@router.post("", response_model=TableOut, status_code=status.HTTP_201_CREATED)
def create_table(
    payload: TableInput,
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin])),
):
    try:
        return crud_table.create_table(db, _tenant_id(db), payload.number, payload.seats)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/{table_id}/status", response_model=TableOut)
def set_status(
    table_id: str,
    payload: TableStatusInput,
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    table = crud_table.set_table_status(db, _tenant_id(db), table_id, payload.status)
    if table is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mesa não encontrada")
    return table
