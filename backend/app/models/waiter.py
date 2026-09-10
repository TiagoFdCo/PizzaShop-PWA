import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.staff import Staff


class TableStatus(str, enum.Enum):
    livre = "livre"
    ocupada = "ocupada"


class TabStatus(str, enum.Enum):
    aberta = "aberta"
    paga = "paga"


class RestaurantTable(Base):
    __tablename__ = "restaurant_table"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TableStatus] = mapped_column(
        SAEnum(TableStatus, name="table_status"), nullable=False, default=TableStatus.livre
    )

    tabs: Mapped[list["Tab"]] = relationship(back_populates="table")


class Tab(Base):
    """Comanda. 1 mesa : N comandas — mas só uma 'aberta' por mesa por vez
    (regra aplicada em app/crud/waiter.py, não no schema do banco)."""

    __tablename__ = "tab"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    table_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurant_table.id", ondelete="CASCADE"), nullable=False)
    waiter_id: Mapped[str] = mapped_column(String(36), ForeignKey("staff.id"), nullable=False)
    status: Mapped[TabStatus] = mapped_column(
        SAEnum(TabStatus, name="tab_status"), nullable=False, default=TabStatus.aberta
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    table: Mapped["RestaurantTable"] = relationship(back_populates="tabs")
    waiter: Mapped["Staff"] = relationship()
    orders: Mapped[list["Order"]] = relationship(back_populates="tab")


class OrderRating(Base):
    """1:1 com Order — critério de aceite da #73 exige unicidade (uma nota por pedido)."""

    __tablename__ = "order_rating"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("order.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    stars: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5, validado no schema (Pydantic), não aqui
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    order: Mapped["Order"] = relationship(back_populates="rating")