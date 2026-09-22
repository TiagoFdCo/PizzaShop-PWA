"""fase4 (P1): cliente (login + CPF) e pagamento concreto — merge dos heads

Merge point: existiam dois heads divergentes a partir de 202609110001
(202609200002 — múltiplas comandas, P5; e 202609220001 — cupons e
fidelidade, P3). Esta migration fecha os dois num só, como o comentário em
202609220001 já previa ("quem fizer merge por último ajusta o
down_revision"), e também completa a FK que P3 deixou pendente
propositalmente: loyalty_account.customer_id -> customer.id.

Cria customer e payment, adiciona order.customer_id (nulo em pedido de
convidado).

Revision ID: 202609230001
Revises: 202609200002, 202609220001
Create Date: 2026-09-23 00:00:01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202609230001"
down_revision: Union[str, tuple[str, ...], None] = ("202609200002", "202609220001")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # 1) ENUM novo (idempotente, mesmo padrão das migrations anteriores) -----
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE payment_status AS ENUM ('pendente', 'aprovado', 'recusado');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))

    payment_status = postgresql.ENUM("pendente", "aprovado", "recusado", name="payment_status", create_type=False)
    # payment_method já existe desde o schema inicial — reusa create_type=False.
    payment_method = postgresql.ENUM("pix", "cartao", "dinheiro", name="payment_method", create_type=False)

    # 2) customer --------------------------------------------------------------
    op.create_table(
        "customer",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("cpf", sa.String(length=11), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("cep", sa.String(length=8), nullable=False),
        sa.Column("street", sa.String(length=180), nullable=False),
        sa.Column("number", sa.String(length=20), nullable=False),
        sa.Column("complement", sa.String(length=120), nullable=True),
        sa.Column("neighborhood", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("state", sa.String(length=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("cpf", name="uq_customer_cpf"),
    )
    op.create_index("ix_customer_cpf", "customer", ["cpf"])

    # 3) order.customer_id — nulo em pedido de convidado ------------------------
    op.add_column(
        "order",
        sa.Column("customer_id", sa.String(length=36), sa.ForeignKey("customer.id", ondelete="SET NULL"), nullable=True),
    )

    # 4) payment ------------------------------------------------------------
    op.create_table(
        "payment",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("order.id", ondelete="CASCADE"), nullable=False),
        sa.Column("method", payment_method, nullable=False),
        sa.Column("status", payment_status, nullable=False, server_default="pendente"),
        sa.Column("transaction_id", sa.String(length=60), nullable=False),
        sa.Column("mp_preference_id", sa.String(length=80), nullable=True),
        sa.Column("mp_payment_id", sa.String(length=40), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("order_id", name="uq_payment_order_id"),
    )

    # 5) fecha a FK que o P3 deixou pendente de propósito em
    #    202609220001 (loyalty_account.customer_id -> customer.id) --------
    op.create_foreign_key(
        "fk_loyalty_account_customer_id",
        "loyalty_account",
        "customer",
        ["customer_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_loyalty_account_customer_id", "loyalty_account", type_="foreignkey")
    op.drop_table("payment")
    op.drop_column("order", "customer_id")
    op.drop_index("ix_customer_cpf", table_name="customer")
    op.drop_table("customer")

    op.execute("DROP TYPE IF EXISTS payment_status")
