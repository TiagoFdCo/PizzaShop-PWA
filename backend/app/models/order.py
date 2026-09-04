import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.staff import Staff


class OrderStatus(str, enum.Enum):
    recebido = "recebido"
    preparo = "preparo"
    pronto_entrega = "pronto_entrega"
    saiu_para_entrega = "saiu_para_entrega"
    entregue = "entregue"
    falha_entrega = "falha_entrega"


# Fluxo linear "feliz" do pedido. falha_entrega é um desvio a partir de
# saiu_para_entrega e fica FORA desta lista — quem usa isso pra desenhar
# progresso (ex. rota /orders/{id}/dispatch) precisa tratar falha à parte.
ORDER_STATUS_FLOW: list[OrderStatus] = [
    OrderStatus.recebido,
    OrderStatus.preparo,
    OrderStatus.pronto_entrega,
    OrderStatus.saiu_para_entrega,
    OrderStatus.entregue,
]


class PaymentMethod(str, enum.Enum):
    pix = "pix"
    cartao = "cartao"
    dinheiro = "dinheiro"


class DeliveryFailureReason(str, enum.Enum):
    cliente_ausente = "cliente_ausente"
    endereco_nao_encontrado = "endereco_nao_encontrado"
    cliente_recusou = "cliente_recusou"
    problema_veiculo = "problema_veiculo"
    outro = "outro"


class Order(Base):
    """
    Pedido. `cook_id`/`driver_id` são FKs de verdade pra staff (diferente do
    mock em db.json, que embutia {id, name} pra evitar fetch extra — aqui o
    JOIN resolve isso sem duplicar dado). Cliente não tem tabela própria:
    dados soltos em customer_* porque ele não autentica no sistema.
    """

    __tablename__ = "order"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)

    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_address: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(30), nullable=False)

    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod, name="payment_method"), nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Float, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name="order_status"), nullable=False, default=OrderStatus.recebido
    )

    cook_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("staff.id"), nullable=True)
    driver_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("staff.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    delivery_failure: Mapped["DeliveryFailure | None"] = relationship(
        back_populates="order", cascade="all, delete-orphan", uselist=False
    )
    cook: Mapped["Staff | None"] = relationship(foreign_keys=[cook_id])
    driver: Mapped["Staff | None"] = relationship(foreign_keys=[driver_id])

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status}>"


class OrderItem(Base):
    """Uma pizza já customizada (tamanho + adicionais) dentro de um pedido."""

    __tablename__ = "order_item"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("order.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("product.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    size: Mapped[str] = mapped_column(String(1), nullable=False)  # "P" | "M" | "G"
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="items")
    toppings: Mapped[list["OrderItemTopping"]] = relationship(
        back_populates="order_item", cascade="all, delete-orphan"
    )


class OrderItemTopping(Base):
    """Snapshot de um adicional escolhido num item do pedido (nome/preço
    congelados no momento da compra — não referencia product_topping por FK
    de propósito, pra o pedido não mudar se o cardápio mudar depois)."""

    __tablename__ = "order_item_topping"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_item_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("order_item.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    order_item: Mapped["OrderItem"] = relationship(back_populates="toppings")


class DeliveryFailure(Base):
    """Registro de tentativa de entrega frustrada. 1:1 com Order (unique)."""

    __tablename__ = "delivery_failure"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("order.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    reason: Mapped[DeliveryFailureReason] = mapped_column(
        SAEnum(DeliveryFailureReason, name="delivery_failure_reason"), nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    order: Mapped["Order"] = relationship(back_populates="delivery_failure")
