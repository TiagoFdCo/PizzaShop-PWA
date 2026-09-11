from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseInput


def list_expenses(db: Session, tenant_id: str) -> list[Expense]:
    stmt = (
        select(Expense)
        .where(Expense.tenant_id == tenant_id)
        .order_by(Expense.date.desc(), Expense.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def create_expense(db: Session, tenant_id: str, data: ExpenseInput) -> Expense:
    expense = Expense(
        tenant_id=tenant_id,
        description=data.description,
        category=data.category,
        amount=data.amount,
        date=data.date,
        notes=data.notes,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, tenant_id: str, expense_id: str) -> bool:
    expense = db.get(Expense, expense_id)
    if expense is None or expense.tenant_id != tenant_id:
        return False
    db.delete(expense)
    db.commit()
    return True
