"""schema inicial

Revision ID: 202608310001
Revises:
Create Date: 2026-08-31 00:00:01

Escrita à mão (não gerada por autogenerate) porque o ambiente de dev não tem
Postgres acessível neste momento. Antes de rodar de verdade, confira com
`alembic upgrade head` contra um Postgres local — se algo divergir dos
models, ajuste esta migration em vez de criar uma segunda por cima.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "202608310001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    staff_role = sa.Enum("admin", "cozinha", "entrega", name="staff_role")
    order_status = sa.Enum(
        "recebido", "preparo", "pronto_entrega", "saiu_para_entrega", "entregue", "falha_entrega",
        name="order_status",
    )
    payment_method = sa.Enum("pix", "cartao", "dinheiro", name="payment_method")
    delivery_failure_reason = sa.Enum(
        "cliente_ausente", "endereco_nao_encontrado", "cliente_recusou", "problema_veiculo", "outro",
        name="delivery_failure_reason",
    )

    bind = op.get_bind()
    staff_role.create(bind, checkfirst=True)
    order_status.create(bind, checkfirst=True)
    payment_method.create(bind, checkfirst=True)
    delivery_failure_reason.create(bind, checkfirst=True)

    op.create_table(
        "tenant",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("tagline", sa.String(length=255), nullable=False),
        sa.Column("about_text", sa.String(length=2000), nullable=False),
        sa.Column("logo_url", sa.String(length=500), nullable=False),
        sa.Column("banner_url", sa.String(length=500), nullable=False),
        sa.Column("primary_color", sa.String(length=20), nullable=False),
        sa.Column("secondary_color", sa.String(length=20), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("opening_hours", sa.String(length=120), nullable=False),
        sa.Column("whatsapp", sa.String(length=30), nullable=False),
        sa.Column("instagram", sa.String(length=60), nullable=False),
        sa.Column("delivery_fee", sa.Float(), nullable=False),
        sa.Column("delivery_radius_km", sa.Float(), nullable=False),
        sa.Column("avg_prep_time_min", sa.Integer(), nullable=False),
        sa.Column("min_order_value", sa.Float(), nullable=False),
        sa.Column("enabled_payment_methods", sa.ARRAY(sa.String()), nullable=False),
    )

    op.create_table(
        "staff",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("role", staff_role, nullable=False),
        sa.Column("username", sa.String(length=60), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.UniqueConstraint("username", name="uq_staff_username"),
    )
    op.create_index("ix_staff_username", "staff", ["username"])

    op.create_table(
        "product",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("base_price", sa.Float(), nullable=False),
        sa.Column("available_sizes", sa.ARRAY(sa.String()), nullable=False),
    )

    op.create_table(
        "product_topping",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("product.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
    )

    op.create_table(
        "order",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_name", sa.String(length=120), nullable=False),
        sa.Column("customer_address", sa.String(length=255), nullable=False),
        sa.Column("customer_phone", sa.String(length=30), nullable=False),
        sa.Column("payment_method", payment_method, nullable=False),
        sa.Column("subtotal", sa.Float(), nullable=False),
        sa.Column("delivery_fee", sa.Float(), nullable=False),
        sa.Column("total", sa.Float(), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="recebido"),
        sa.Column("cook_id", sa.String(length=36), sa.ForeignKey("staff.id"), nullable=True),
        sa.Column("driver_id", sa.String(length=36), sa.ForeignKey("staff.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "order_item",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("order.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.String(length=36), sa.ForeignKey("product.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("size", sa.String(length=1), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
    )

    op.create_table(
        "order_item_topping",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "order_item_id", sa.String(length=36), sa.ForeignKey("order_item.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
    )

    op.create_table(
        "delivery_failure",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("order_id", sa.String(length=36), sa.ForeignKey("order.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", delivery_failure_reason, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("order_id", name="uq_delivery_failure_order_id"),
    )


def downgrade() -> None:
    op.drop_table("delivery_failure")
    op.drop_table("order_item_topping")
    op.drop_table("order_item")
    op.drop_table("order")
    op.drop_table("product_topping")
    op.drop_table("product")
    op.drop_index("ix_staff_username", table_name="staff")
    op.drop_table("staff")
    op.drop_table("tenant")

    bind = op.get_bind()
    sa.Enum(name="delivery_failure_reason").drop(bind, checkfirst=True)
    sa.Enum(name="payment_method").drop(bind, checkfirst=True)
    sa.Enum(name="order_status").drop(bind, checkfirst=True)
    sa.Enum(name="staff_role").drop(bind, checkfirst=True)
