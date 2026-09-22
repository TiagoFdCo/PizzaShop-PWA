import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.order import PaymentMethod

if TYPE_CHECKING:
    from app.models.order import Order


class PaymentStatus(str, enum.Enum):
    pendente = "pendente"
    aprovado = "aprovado"
    recusado = "recusado"


class Payment(Base):
    """
    Registro real de pagamento de um pedido, agora via Mercado Pago
    (Checkout Pro) — substitui o Math.random() que existia no front e a
    versão anterior "simulada localmente" no backend. 1:1 com Order — cada
    pedido tem no máximo um Payment; um retry atualiza o mesmo registro
    (nova preferência no Mercado Pago) em vez de criar outro.

    `dinheiro` (pagar na entrega) nunca passa pelo Mercado Pago — não há o
    que cobrar num gateway pra pagamento presencial — e é aprovado
    localmente na hora (ver crud/payment.py).
    """

    __tablename__ = "payment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("order.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod, name="payment_method"), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.pendente
    )
    transaction_id: Mapped[str] = mapped_column(String(60), nullable=False)
    # Preenchidos só quando passa pelo Mercado Pago (nulo em "dinheiro").
    mp_preference_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    mp_payment_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    order: Mapped["Order"] = relationship()

    def __repr__(self) -> str:
        return f"<Payment id={self.id} order_id={self.order_id} status={self.status}>"
