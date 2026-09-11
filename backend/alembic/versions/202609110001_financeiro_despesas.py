"""financeiro: tabela de despesas (expense)

Revision ID: 202609110001
Revises: 202609070001
Create Date: 2026-09-11 00:00:01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202609110001"
down_revision: Union[str, None] = "202609070001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE expense_category AS ENUM (
                'ingredientes', 'funcionarios', 'aluguel', 'energia',
                'agua', 'internet', 'manutencao', 'marketing', 'outros'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))

    expense_category = postgresql.ENUM(
        "ingredientes", "funcionarios", "aluguel", "energia",
        "agua", "internet", "manutencao", "marketing", "outros",
        name="expense_category", create_type=False,
    )

    op.create_table(
        "expense",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("category", expense_category, nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_expense_tenant_date", "expense", ["tenant_id", "date"])


def downgrade() -> None:
    op.drop_index("ix_expense_tenant_date", table_name="expense")
    op.drop_table("expense")
    op.execute("DROP TYPE IF EXISTS expense_category")
