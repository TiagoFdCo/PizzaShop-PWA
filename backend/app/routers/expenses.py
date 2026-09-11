from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import expense as crud_expense
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import StaffRole
from app.schemas.expense import ExpenseInput, ExpenseOut

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return tenant.id


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> list[ExpenseOut]:
    """Lista todas as despesas do tenant — o front filtra por mês."""
    return [ExpenseOut.model_validate(e) for e in crud_expense.list_expenses(db, _tenant_id(db))]


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseInput,
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> ExpenseOut:
    expense = crud_expense.create_expense(db, _tenant_id(db), data)
    return ExpenseOut.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> None:
    ok = crud_expense.delete_expense(db, _tenant_id(db), expense_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Despesa não encontrada")
