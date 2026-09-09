from app.schemas.common import CamelModel


class ChannelSummary(CamelModel):
    """Faturamento/custo/lucro agrupado por canal de venda."""

    channel: str          # "delivery" | "dine_in"
    revenue: float        # faturamento bruto
    cost: float           # custo dos produtos
    profit: float         # revenue - cost


class StaffBreakdown(CamelModel):
    """Participação individual de garçom ou entregador."""

    staff_id: str
    name: str
    role: str             # "entrega" | "garcom"
    orders_count: int
    revenue: float


class FinancialSummary(CamelModel):
    """Payload retornado por GET /reports/summary."""

    total_revenue: float
    total_cost: float
    gross_profit: float
    average_rating: float | None
    orders_count: int
    channel_breakdown: list[ChannelSummary]
    staff_breakdown: list[StaffBreakdown]


class OrderLedgerRow(CamelModel):
    """Linha da aba 'Lista de Pedidos' no Excel e do endpoint /reports/ledger."""

    order_id: str
    created_at: str       # ISO-8601
    channel: str
    customer_name: str
    cook_name: str | None
    driver_name: str | None
    subtotal: float
    delivery_fee: float
    total: float
    cost: float
    profit: float
    rating: float | None
    status: str
