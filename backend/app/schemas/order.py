from datetime import datetime

from app.models.order import DeliveryFailureReason, OrderStatus, PaymentMethod
from app.schemas.common import CamelModel
from app.schemas.staff import StaffRef

# Rótulos em PT-BR para cada motivo de falha — útil pra qualquer endpoint ou
# validação que precise devolver uma mensagem amigável (o front também tem a
# sua própria cópia em types/order.ts; manter os dois em sincronia).
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
    """Snapshot enviado pelo front ao criar o pedido — nome/preço no momento
    da compra, sem referenciar o topping do cardápio por id."""

    name: str
    price: float


class OrderItemBase(CamelModel):
    product_id: str
    name: str
    image_url: str = ""
    size: str  # "P" | "M" | "G"
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
    """Payload de PATCH /orders/{id}/failed."""

    reason: DeliveryFailureReason
    description: str | None = None


class DeliveryFailureOut(CamelModel):
    reason: DeliveryFailureReason
    description: str | None = None
    reported_at: datetime


class OrderInput(CamelModel):
    """Payload de POST /orders — id/status/createdAt/cook/driver são
    definidos pela API, igual já era no mock json-server."""

    items: list[OrderItemInput]
    customer: CustomerInfo
    payment_method: PaymentMethod
    subtotal: float
    delivery_fee: float
    total: float


class DispatchInput(CamelModel):
    """Payload de PATCH /orders/{id}/dispatch — cozinheiro escolhe o entregador."""

    driver_id: str


class OrderOut(CamelModel):
    """
    NOTA PRA QUEM MONTAR crud/order.py (rotas de pedido): este schema não sai
    de `Order.model_validate(order_orm)` de graça, porque `customer` aqui é
    aninhado e no ORM está achatado (customer_name/address/phone), e
    `cook`/`driver` viram StaffRef (id+name) a partir do relationship
    Order.cook / Order.driver. Monte um dict (ou um helper `order_to_out`)
    antes de validar, algo como:

        OrderOut.model_validate({
            **order.__dict__,
            "customer": {"name": order.customer_name, "address": order.customer_address, "phone": order.customer_phone},
            "cook": order.cook,
            "driver": order.driver,
            "delivery_failure": order.delivery_failure,
        })
    """

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
