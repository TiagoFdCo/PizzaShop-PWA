"""fase4 (P3): cupons de desconto e fidelidade

Cria coupon, loyalty_account, loyalty_transaction e adiciona ao `order` os
campos de desconto (coupon_code, coupon_discount, loyalty_discount,
points_redeemed, points_earned).

ATENÇÃO NA INTEGRAÇÃO: as outras frentes da Fase 4 (P1 customer/payment,
P5 comandas) também vão criar migrations a partir de 202609110001. Quem
fizer merge por último ajusta o `down_revision` da sua migration pra
apontar pra do colega (senão o Alembic acusa "multiple heads").
Esta migration não depende da tabela `customer` (sem FK) de propósito.

Revision ID: 202609220001
Revises: 202609110001
Create Date: 2026-09-22 00:00:01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202609220001"
down_revision: Union[str, None] = "202609110001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE coupon_discount_type AS ENUM ('percentual', 'valor_fixo');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE loyalty_transaction_type AS ENUM ('ganho', 'resgate', 'estorno');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))

    coupon_discount_type = postgresql.ENUM(
        "percentual", "valor_fixo", name="coupon_discount_type", create_type=False
    )
    loyalty_transaction_type = postgresql.ENUM(
        "ganho", "resgate", "estorno", name="loyalty_transaction_type", create_type=False
    )

    # coupon ------------------------------------------------------------------
    op.create_table(
        "coupon",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("discount_type", coupon_discount_type, nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("min_order_value", sa.Float(), nullable=False, server_default="0"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("tenant_id", "code", name="uq_coupon_code_per_tenant"),
    )
    op.create_index("ix_coupon_code", "coupon", ["code"])

    # loyalty_account ---------------------------------------------------------
    op.create_table(
        "loyalty_account",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),  # FK p/ customer entra depois (P1)
        sa.Column("points_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lifetime_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("points_balance >= 0", name="ck_loyalty_balance_non_negative"),
    )
    op.create_index("ix_loyalty_account_customer_id", "loyalty_account", ["customer_id"], unique=True)

    # loyalty_transaction -----------------------------------------------------
    op.create_table(
        "loyalty_transaction",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "account_id", sa.String(length=36),
            sa.ForeignKey("loyalty_account.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("order.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", loyalty_transaction_type, nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_loyalty_transaction_account_id", "loyalty_transaction", ["account_id"])

    # order: campos de desconto ----------------------------------------------
    op.add_column("order", sa.Column("coupon_code", sa.String(length=30), nullable=True))
    op.add_column("order", sa.Column("coupon_discount", sa.Float(), nullable=False, server_default="0"))
    op.add_column("order", sa.Column("loyalty_discount", sa.Float(), nullable=False, server_default="0"))
    op.add_column("order", sa.Column("points_redeemed", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("order", sa.Column("points_earned", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("order", "points_earned")
    op.drop_column("order", "points_redeemed")
    op.drop_column("order", "loyalty_discount")
    op.drop_column("order", "coupon_discount")
    op.drop_column("order", "coupon_code")

    op.drop_index("ix_loyalty_transaction_account_id", table_name="loyalty_transaction")
    op.drop_table("loyalty_transaction")
    op.drop_index("ix_loyalty_account_customer_id", table_name="loyalty_account")
    op.drop_table("loyalty_account")
    op.drop_index("ix_coupon_code", table_name="coupon")
    op.drop_table("coupon")

    op.execute("DROP TYPE IF EXISTS loyalty_transaction_type")
    op.execute("DROP TYPE IF EXISTS coupon_discount_type")
