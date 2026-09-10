"""fundacao_fase_3_mesas_comandas_avaliacao_custo_canal

Revision ID: 9876d9c46d94
Revises: 202608310001
Create Date: 2026-09-09 16:06:38.778265

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9876d9c46d94'
down_revision: Union[str, None] = '202608310001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'garcom'")

    # table_status e tab_status: usados dentro de create_table() abaixo,
    # o SQLAlchemy cria o tipo sozinho nesse caso — NÃO chamar .create() aqui.
    table_status = sa.Enum("livre", "ocupada", name="table_status")
    tab_status = sa.Enum("aberta", "paga", name="tab_status")

    # order_channel: só é usado em add_column() mais abaixo (não em
    # create_table), e nesse caso o SQLAlchemy NÃO cria o tipo sozinho —
    # precisa criar explicitamente antes de usar.
    order_channel = sa.Enum("delivery", "dine_in", name="order_channel")
    order_channel.create(op.get_bind())

    op.create_table(
        "restaurant_table",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("status", table_status, nullable=False, server_default="livre"),
    )

    op.create_table(
        "tab",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("table_id", sa.String(36), sa.ForeignKey("restaurant_table.id", ondelete="CASCADE"), nullable=False),
        sa.Column("waiter_id", sa.String(36), sa.ForeignKey("staff.id"), nullable=False),
        sa.Column("status", tab_status, nullable=False, server_default="aberta"),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.execute(
        "CREATE UNIQUE INDEX ix_tab_one_open_per_table "
        "ON tab (table_id) WHERE status = 'aberta'"
    )

    op.add_column(
        "order",
        sa.Column("channel", order_channel, nullable=False, server_default="delivery"),
    )
    op.add_column(
        "order",
        sa.Column("tab_id", sa.String(36), sa.ForeignKey("tab.id"), nullable=True),
    )
    op.add_column(
        "order",
        sa.Column("frozen_cost", sa.Float(), nullable=False, server_default="0"),
    )

    op.add_column(
        "product",
        sa.Column("cost", sa.Float(), nullable=False, server_default="0"),
    )

    op.create_table(
        "order_rating",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("order.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("stars", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("order_rating")
    op.drop_column("product", "cost")
    op.drop_column("order", "frozen_cost")
    op.drop_column("order", "tab_id")
    op.drop_column("order", "channel")
    op.execute("DROP INDEX IF EXISTS ix_tab_one_open_per_table")
    op.drop_table("tab")
    op.drop_table("restaurant_table")

    sa.Enum(name="order_channel").drop(op.get_bind())
    sa.Enum(name="tab_status").drop(op.get_bind())
    sa.Enum(name="table_status").drop(op.get_bind())
