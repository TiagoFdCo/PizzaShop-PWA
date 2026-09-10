from datetime import datetime

from pydantic import Field

from app.models.order import DeliveryFailureReason, OrderStatus, PaymentMethod
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
    total: float


class DispatchInput(CamelModel):
    driver_id: str


class OrderRatingInput(CamelModel):
    """Payload de POST /orders/{id}/rating."""

    stars: int = Field(ge=1, le=5)


class OrderOut(CamelModel):
    id: str
    items: list[OrderItemOut]
    customer: CustomerInfo
    payment_method: PaymentMethod
    subtotal: float
    delivery_fee: float
    total: float
    status: OrderStatus
    created_at: datetime

    cook: StaffRef | None = None
    driver: StaffRef | None = None
    delivery_failure: DeliveryFailureOut | None = None
    rating: int | None = None