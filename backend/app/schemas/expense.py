from datetime import date, datetime

from app.models.expense import ExpenseCategory
from app.schemas.common import CamelModel


class ExpenseInput(CamelModel):
    """Payload de POST /expenses."""

    description: str
    category: ExpenseCategory
    amount: float
    date: date
    notes: str | None = None


class ExpenseOut(CamelModel):
    id: str
    description: str
    category: ExpenseCategory
    amount: float
    date: date
    notes: str | None = None
    created_at: datetime
