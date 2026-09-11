from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.staff import Staff, StaffRole
from app.models.waiter import OrderRating
from app.schemas.report import (
    ChannelSummary,
    FinancialSummary,
    OrderLedgerRow,
    StaffBreakdown,
)

# ─── Mock data (usado quando REPORTS_USE_MOCK=true ou como fallback) ─────────

_MOCK_SUMMARY = FinancialSummary(
    total_revenue=18_450.0,
    total_cost=7_380.0,
    gross_profit=11_070.0,
    average_rating=4.3,
    orders_count=142,
    channel_breakdown=[
        ChannelSummary(channel="delivery", revenue=12_100.0, cost=4_840.0, profit=7_260.0),
        ChannelSummary(channel="dine_in",  revenue=6_350.0,  cost=2_540.0, profit=3_810.0),
    ],
    staff_breakdown=[
        StaffBreakdown(staff_id="s1", name="Carlos",  role="entrega", orders_count=58, revenue=7_250.0),
        StaffBreakdown(staff_id="s2", name="Beatriz", role="entrega", orders_count=44, revenue=4_850.0),
        StaffBreakdown(staff_id="s3", name="Lucas",   role="garcom",  orders_count=40, revenue=6_350.0),
    ],
)

_MOCK_LEDGER: list[OrderLedgerRow] = [
    OrderLedgerRow(
        order_id="ord-001", created_at="2026-09-09T10:00:00Z", channel="delivery",
        customer_name="Ana Silva", cook_name="Pedro", driver_name="Carlos",
        subtotal=62.0, delivery_fee=8.0, total=70.0, cost=28.0, profit=42.0,
        rating=5.0, status="entregue",
    ),
    OrderLedgerRow(
        order_id="ord-002", created_at="2026-09-09T11:30:00Z", channel="dine_in",
        customer_name="Mesa 3", cook_name="Pedro", driver_name=None,
        subtotal=95.0, delivery_fee=0.0, total=95.0, cost=38.0, profit=57.0,
        rating=4.0, status="entregue",
    ),
    OrderLedgerRow(
        order_id="ord-003", created_at="2026-09-09T12:15:00Z", channel="delivery",
        customer_name="João Freitas", cook_name="Maria", driver_name="Beatriz",
        subtotal=45.0, delivery_fee=8.0, total=53.0, cost=18.0, profit=35.0,
        rating=None, status="saiu_para_entrega",
    ),
]


# ─── Real DB queries ───────────────────────────────────────────────────────────
#
# NOTA (corrigido): a versão anterior somava `Order.cost_snapshot` e tirava
# média de `Order.rating` — nenhum dos dois é uma coluna real. O custo é
# CONGELADO por item (`OrderItem.cost`, ver D1), não por pedido; a nota é um
# relacionamento 1:1 com `order_rating.stars` (ver `OrderRating`), não um
# número na própria linha do pedido. Isso fazia a consulta real estourar
# exceção e cair sempre no mock — o financeiro nunca refletia dados reais.

def _order_cost_subquery():
    """Custo total por pedido = soma de (OrderItem.cost * quantity)."""
    return (
        select(
            OrderItem.order_id.label("order_id"),
            func.coalesce(func.sum(OrderItem.cost * OrderItem.quantity), 0).label("cost"),
        )
        .group_by(OrderItem.order_id)
        .subquery()
    )


def get_financial_summary(db: Session) -> FinancialSummary:
    """Agrega faturamento, custo e lucro a partir do banco (dados reais)."""
    cost_sq = _order_cost_subquery()

    # Totais gerais + nota média (join com order_rating, não com Order.rating)
    row = db.execute(
        select(
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.total), 0).label("total_revenue"),
            func.coalesce(func.sum(cost_sq.c.cost), 0).label("total_cost"),
            func.avg(OrderRating.stars).label("avg_rating"),
        )
        .outerjoin(cost_sq, cost_sq.c.order_id == Order.id)
        .outerjoin(OrderRating, OrderRating.order_id == Order.id)
    ).one()

    total_revenue = float(row.total_revenue)
    total_cost = float(row.total_cost)

    # Breakdown por canal (delivery / dine_in)
    channel_rows = db.execute(
        select(
            Order.channel,
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
            func.coalesce(func.sum(cost_sq.c.cost), 0).label("cost"),
        )
        .outerjoin(cost_sq, cost_sq.c.order_id == Order.id)
        .group_by(Order.channel)
    ).all()
    channel_breakdown = [
        ChannelSummary(
            channel=r.channel.value if hasattr(r.channel, "value") else r.channel,
            revenue=float(r.revenue),
            cost=float(r.cost),
            profit=float(r.revenue) - float(r.cost),
        )
        for r in channel_rows
    ]

    # Breakdown por staff que gerou faturamento: entregador (driver_id) no
    # delivery e garçom (waiter_id) no presencial — o roteiro pede os dois.
    staff_breakdown: list[StaffBreakdown] = []
    for staff_fk, role in ((Order.driver_id, StaffRole.entrega), (Order.waiter_id, StaffRole.garcom)):
        staff_rows = db.execute(
            select(
                Staff.id, Staff.name, Staff.role,
                func.count(Order.id).label("orders_count"),
                func.coalesce(func.sum(Order.total), 0).label("revenue"),
            )
            .join(Order, staff_fk == Staff.id)
            .where(Staff.role == role)
            .group_by(Staff.id, Staff.name, Staff.role)
        ).all()
        staff_breakdown += [
            StaffBreakdown(
                staff_id=r.id, name=r.name,
                role=r.role.value if hasattr(r.role, "value") else r.role,
                orders_count=r.orders_count, revenue=float(r.revenue),
            )
            for r in staff_rows
        ]

    return FinancialSummary(
        total_revenue=total_revenue,
        total_cost=total_cost,
        gross_profit=total_revenue - total_cost,
        average_rating=float(row.avg_rating) if row.avg_rating is not None else None,
        orders_count=row.orders_count,
        channel_breakdown=channel_breakdown,
        staff_breakdown=staff_breakdown,
    )


def get_order_ledger(db: Session) -> list[OrderLedgerRow]:
    """Retorna lista linha a linha de pedidos entregues para a aba 'Lista de Pedidos'."""
    cost_sq = _order_cost_subquery()

    rows = db.execute(
        select(Order, cost_sq.c.cost, OrderRating.stars)
        .outerjoin(cost_sq, cost_sq.c.order_id == Order.id)
        .outerjoin(OrderRating, OrderRating.order_id == Order.id)
        .where(Order.status == OrderStatus.entregue)
        .order_by(Order.created_at.desc())
    ).all()

    ledger: list[OrderLedgerRow] = []
    for o, cost, stars in rows:
        cost = float(cost or 0)
        ledger.append(
            OrderLedgerRow(
                order_id=o.id,
                created_at=o.created_at.isoformat(),
                channel=o.channel.value if hasattr(o.channel, "value") else o.channel,
                customer_name=o.customer_name,
                cook_name=o.cook.name if o.cook else None,
                driver_name=o.driver.name if o.driver else None,
                subtotal=o.subtotal,
                delivery_fee=o.delivery_fee,
                total=o.total,
                cost=cost,
                profit=o.total - cost,
                rating=float(stars) if stars is not None else None,
                status=o.status.value,
            )
        )
    return ledger
