"""Fase 4 (P3) — Cupom de desconto.

Um cupom é identificado por um código (sempre salvo em MAIÚSCULAS) e dá um
desconto sobre o SUBTOTAL do pedido — nunca sobre a taxa de entrega.
Regras de validação ficam em app/crud/coupon.py (validate_coupon).
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CouponDiscountType(str, enum.Enum):
    percentual = "percentual"   # value = 10  -> 10% do subtotal
    valor_fixo = "valor_fixo"   # value = 15  -> R$ 15,00 (limitado ao subtotal)


class Coupon(Base):
    __tablename__ = "coupon"
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_coupon_code_per_tenant"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)

    code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    discount_type: Mapped[CouponDiscountType] = mapped_column(
        SAEnum(CouponDiscountType, name="coupon_discount_type"), nullable=False
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    min_order_value: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    # Janela de validade. valid_until nulo = não expira.
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Limite global de usos. max_uses nulo = ilimitado.
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uses_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<Coupon code={self.code} type={self.discount_type} value={self.value}>"
