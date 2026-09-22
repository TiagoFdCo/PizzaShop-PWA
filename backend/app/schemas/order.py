from datetime import datetime

from pydantic import Field

from app.models.order import DeliveryFailureReason, OrderChannel, OrderStatus, PaymentMethod
from app.schemas.common import CamelModel
from app.schemas.staff import StaffRef

DELIVERY_FAILURE_REASON_LABELS: dict[DeliveryFailureReason, str] = {
    DeliveryFailureReason.cliente_ausente: "Cliente ausente no endereço",
    DeliveryFailureReason.endereco_nao_encontrado: "Endereço não encontrado",
    DeliveryFailureReason.cliente_recusou: "Cliente recusou o pedido",
    DeliveryFailureReason.problema_veiculo: "Problema com o veículo",
    DeliveryFailureReason.outro: "Outro motivo",
}


class OrderItemToppingOut(CamelModel):
    id: str
    name: str
    price: float


class OrderItemToppingInput(CamelModel):
    name: str
    price: float


class OrderItemBase(CamelModel):
    product_id: str
    name: str
    image_url: str = ""
    size: str
    unit_price: float
    quantity: int = 1
    notes: str | None = None


class OrderItemInput(OrderItemBase):
    toppings: list[OrderItemToppingInput] = []


class OrderItemOut(OrderItemBase):
    id: str
    toppings: list[OrderItemToppingOut] = []


class CustomerInfo(CamelModel):
    name: str
    address: str
    phone: str


class DeliveryFailureInput(CamelModel):
    reason: DeliveryFailureReason
    description: str | None = None


class DeliveryFailureOut(CamelModel):
    reason: DeliveryFailureReason
    description: str | None = None
    reported_at: datetime


class OrderInput(CamelModel):
    items: list[OrderItemInput]
    customer: CustomerInfo
    payment_method: PaymentMethod
    subtotal: float
    delivery_fee: float
    total: float  # informativo: o backend recalcula com os descontos
    # Fase 4 (P3): opcionais — pedido sem cupom/pontos continua igual.
    coupon_code: str | None = None
    redeem_points: int = Field(default=0, ge=0)


class DispatchInput(CamelModel):
    driver_id: str


class OrderRatingInput(CamelModel):
    """Payload de POST /orders/{id}/rating."""

    stars: int = Field(ge=1, le=5)


class OrderOut(CamelModel):
    id: str
    items: list[OrderItemOut]
    customer_id: str | None = None  # Fase 4 (P1): presente quando o pedido foi feito logado
    customer: CustomerInfo
    payment_method: PaymentMethod
    subtotal: float
    delivery_fee: float
    total: float
    status: OrderStatus
    channel: OrderChannel = OrderChannel.delivery  # Fase 3: delivery | dine_in
    tab_id: str | None = None                      # Fase 3: comanda, se presencial
    created_at: datetime

    cook: StaffRef | None = None
    driver: StaffRef | None = None
    delivery_failure: DeliveryFailureOut | None = None
    rating: int | None = None

    # Fase 4 (P3)
    coupon_code: str | None = None
    coupon_discount: float = 0
    loyalty_discount: float = 0
    points_redeemed: int = 0
    points_earned: int = 0