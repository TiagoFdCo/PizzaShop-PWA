from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.staff import Staff, StaffRole
from app.schemas.report import (
    ChannelSummary,
    FinancialSummary,
    OrderLedgerRow,
    StaffBreakdown,
)

if TYPE_CHECKING:
    pass

# ─── Mock data (flag useMock) ─────────────────────────────────────────────────

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

def get_financial_summary(db: Session) -> FinancialSummary:
    """
    Agrega faturamento, custo e lucro a partir do banco.

    Campos de custo/canal/rating dependem das colunas adicionadas pelo P1 (D1/D3).
    Enquanto não existirem, a query retorna 0 / None de forma segura.
    """
    # Totais gerais
    row = db.execute(
        select(
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.total), 0).label("total_revenue"),
            # cost_snapshot pode não existir ainda — coalesce garante 0
            func.coalesce(func.sum(getattr(Order, "cost_snapshot", Order.total * 0)), 0).label("total_cost"),
            func.avg(getattr(Order, "rating", None)).label("avg_rating"),
        )
    ).one()

    total_revenue = float(row.total_revenue)
    total_cost    = float(row.total_cost)

    # Breakdown por canal (campo `channel` adicionado pelo P1/D3)
    try:
        channel_rows = db.execute(
            select(
                Order.channel,  # type: ignore[attr-defined]
                func.coalesce(func.sum(Order.total), 0).label("revenue"),
                func.coalesce(func.sum(Order.cost_snapshot), 0).label("cost"),  # type: ignore[attr-defined]
            ).group_by(Order.channel)  # type: ignore[attr-defined]
        ).all()
        channel_breakdown = [
            ChannelSummary(
                channel=r.channel,
                revenue=float(r.revenue),
                cost=float(r.cost),
                profit=float(r.revenue) - float(r.cost),
            )
            for r in channel_rows
        ]
    except Exception:
        channel_breakdown = []

    # Breakdown por entregador/garçom
    try:
        staff_rows = db.execute(
            select(
                Staff.id, Staff.name, Staff.role,
                func.count(Order.id).label("orders_count"),
                func.coalesce(func.sum(Order.total), 0).label("revenue"),
            )
            .join(Order, (Order.driver_id == Staff.id))
            .where(Staff.role.in_([StaffRole.entrega]))
            .group_by(Staff.id, Staff.name, Staff.role)
        ).all()
        staff_breakdown = [
            StaffBreakdown(
                staff_id=r.id, name=r.name, role=r.role,
                orders_count=r.orders_count, revenue=float(r.revenue),
            )
            for r in staff_rows
        ]
    except Exception:
        staff_breakdown = []

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
    """Retorna lista linha a linha de pedidos para a aba 'Lista de Pedidos'."""
    orders = db.execute(
        select(Order)
        .where(Order.status == OrderStatus.entregue)
        .order_by(Order.created_at.desc())
    ).scalars().all()

    rows: list[OrderLedgerRow] = []
    for o in orders:
        cost = float(getattr(o, "cost_snapshot", 0) or 0)
        rows.append(
            OrderLedgerRow(
                order_id=o.id,
                created_at=o.created_at.isoformat(),
                channel=getattr(o, "channel", "delivery"),
                customer_name=o.customer_name,
                cook_name=o.cook.name if o.cook else None,
                driver_name=o.driver.name if o.driver else None,
                subtotal=o.subtotal,
                delivery_fee=o.delivery_fee,
                total=o.total,
                cost=cost,
                profit=o.total - cost,
                rating=float(getattr(o, "rating", None)) if getattr(o, "rating", None) is not None else None,
                status=o.status.value,
            )
        )
    return rows
