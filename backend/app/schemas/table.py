"""Schemas (request/response) do presencial: mesa e comanda.
Herdam CamelModel -> API em camelCase, Python em snake_case."""
from datetime import datetime

from app.models.order import OrderChannel
from app.models.waiter import TableStatus, TabStatus
from app.schemas.common import CamelModel
from app.schemas.order import OrderItemInput, OrderItemOut


# ─── Mesa ─────────────────────────────────────────────────────────────────────

class TableInput(CamelModel):
    """POST /tables"""
    number: int
    seats: int | None = None


class TableStatusInput(CamelModel):
    """PATCH /tables/{id}/status"""
    status: TableStatus


class TableOut(CamelModel):
    id: str
    number: int
    seats: int | None = None
    status: TableStatus


# ─── Comanda ──────────────────────────────────────────────────────────────────

class TabInput(CamelModel):
    """POST /tabs — abrir comanda numa mesa."""
    table_id: str


class TabOrderInput(CamelModel):
    """POST /tabs/{id}/orders — lançar itens na comanda (reusa o item do pedido)."""
    items: list[OrderItemInput]


class TabOrderView(CamelModel):
    """Pedido dentro de uma comanda — visão enxuta (sem cliente/entrega)."""
    id: str
    items: list[OrderItemOut]
    channel: OrderChannel
    subtotal: float
    total: float
    created_at: datetime


class TabOut(CamelModel):
    id: str
    table_id: str
    table_number: int
    waiter_id: str | None = None
    status: TabStatus
    opened_at: datetime
    closed_at: datetime | None = None
    total: float
    orders: list[TabOrderView] = []
