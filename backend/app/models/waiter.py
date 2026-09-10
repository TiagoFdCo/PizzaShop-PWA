import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.staff import Staff


class TableStatus(str, enum.Enum):
    livre = "livre"
    ocupada = "ocupada"
    reservada = "reservada"


class TabStatus(str, enum.Enum):
    aberta = "aberta"
    fechada = "fechada"
    paga = "paga"


class RestaurantTable(Base):
    __tablename__ = "restaurant_table"
    __table_args__ = (UniqueConstraint("tenant_id", "number", name="uq_table_number_per_tenant"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[TableStatus] = mapped_column(
        SAEnum(TableStatus, name="table_status"), nullable=False, default=TableStatus.livre
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tabs: Mapped[list["Tab"]] = relationship(back_populates="table")


class Tab(Base):
    __tablename__ = "tab"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    table_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurant_table.id"), nullable=False)
    waiter_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("staff.id"), nullable=True)
    status: Mapped[TabStatus] = mapped_column(
        SAEnum(TabStatus, name="tab_status"), nullable=False, default=TabStatus.aberta
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    table: Mapped["RestaurantTable"] = relationship(back_populates="tabs")
    waiter: Mapped["Staff | None"] = relationship()
    orders: Mapped[list["Order"]] = relationship(back_populates="tab")


class OrderRating(Base):
    __tablename__ = "order_rating"
    __table_args__ = (UniqueConstraint("order_id", name="uq_rating_order"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("order.id", ondelete="CASCADE"), nullable=False)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    order: Mapped["Order"] = relationship(back_populates="rating")