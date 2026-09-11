"""Model de despesa administrativa (aluguel, energia, ingredientes comprados
avulso, etc.) — Financeiro: base pro cálculo 'receita - despesas = lucro'.
Diferente do custo por item (OrderItem.cost, snapshot no pedido), aqui é
lançamento manual feito pelo admin."""
import enum
import uuid
from datetime import date as date_type, datetime, timezone

from sqlalchemy import Date, DateTime, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExpenseCategory(str, enum.Enum):
    ingredientes = "ingredientes"
    funcionarios = "funcionarios"
    aluguel = "aluguel"
    energia = "energia"
    agua = "agua"
    internet = "internet"
    manutencao = "manutencao"
    marketing = "marketing"
    outros = "outros"


class Expense(Base):
    __tablename__ = "expense"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[ExpenseCategory] = mapped_column(
        SAEnum(ExpenseCategory, name="expense_category"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<Expense id={self.id} category={self.category} amount={self.amount}>"
