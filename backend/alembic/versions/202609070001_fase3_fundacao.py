"""fase3 fundacao (mesas, comandas, avaliacao, custo, canal, papel garcom)

Revision ID: 202609070001
Revises: 202608310001
Create Date: 2026-09-07 00:00:01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202609070001"
down_revision: Union[str, None] = "202608310001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # 1) ENUMS NOVOS (idempotente, mesmo padrão do schema_inicial) ------------
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE order_channel AS ENUM ('delivery', 'dine_in');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE table_status AS ENUM ('livre', 'ocupada', 'reservada');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE tab_status AS ENUM ('aberta', 'fechada', 'paga');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))

    order_channel = postgresql.ENUM("delivery", "dine_in", name="order_channel", create_type=False)
    table_status = postgresql.ENUM("livre", "ocupada", "reservada", name="table_status", create_type=False)
    tab_status = postgresql.ENUM("aberta", "fechada", "paga", name="tab_status", create_type=False)

    # 2) restaurant_table -----------------------------------------------------
    op.create_table(
        "restaurant_table",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=True),
        sa.Column("status", table_status, nullable=False, server_default="livre"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("tenant_id", "number", name="uq_table_number_per_tenant"),
    )

    # 3) tab ------------------------------------------------------------------
    op.create_table(
        "tab",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("table_id", sa.String(length=36), sa.ForeignKey("restaurant_table.id"), nullable=False),
        sa.Column("waiter_id", sa.String(length=36), sa.ForeignKey("staff.id"), nullable=True),
        sa.Column("status", tab_status, nullable=False, server_default="aberta"),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total", sa.Float(), nullable=False, server_default="0"),
    )

    # 4) order_rating ---------------------------------------------------------
    op.create_table(
        "order_rating",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("order.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stars", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("order_id", name="uq_rating_order"),
    )

    # 5) COLUNAS NOVAS EM order ----------------------------------------------
    # channel entra com server_default pra não quebrar as linhas já existentes (D3).
    op.add_column("order", sa.Column("channel", order_channel, nullable=False, server_default="delivery"))
    op.add_column("order", sa.Column("waiter_id", sa.String(length=36), sa.ForeignKey("staff.id"), nullable=True))
    op.add_column("order", sa.Column("table_id", sa.String(length=36), sa.ForeignKey("restaurant_table.id"), nullable=True))
    op.add_column("order", sa.Column("tab_id", sa.String(length=36), sa.ForeignKey("tab.id"), nullable=True))

    # 6) CUSTO ----------------------------------------------------------------
    op.add_column("product", sa.Column("cost", sa.Float(), nullable=False, server_default="0"))
    op.add_column("order_item", sa.Column("cost", sa.Float(), nullable=False, server_default="0"))

    # 7) PAPEL garcom NO ENUM staff_role (POR ULTIMO — D2) -------------------
    # ADD VALUE não roda dentro de transação -> autocommit_block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'garcom'")


def downgrade() -> None:
    op.drop_column("order_item", "cost")
    op.drop_column("product", "cost")
    op.drop_column("order", "tab_id")
    op.drop_column("order", "table_id")
    op.drop_column("order", "waiter_id")
    op.drop_column("order", "channel")
    op.drop_table("order_rating")
    op.drop_table("tab")
    op.drop_table("restaurant_table")
    op.execute("DROP TYPE IF EXISTS tab_status")
    op.execute("DROP TYPE IF EXISTS table_status")
    op.execute("DROP TYPE IF EXISTS order_channel")
    # OBS: 'garcom' permanece no enum staff_role — o Postgres não remove valor
    # de enum facilmente. Para um reset total, derrube o volume do banco.
