"""fase4 P5: multiplas comandas por mesa (tab.label + indice unico parcial)

Revision ID: 202609200001
Revises: 202609110001
Create Date: 2026-09-20 00:00:01

Nao ha backfill de proposito: comandas antigas ficam com label NULL (a API
devolve label=null e o front mostra so "Comanda"). NULLs nao colidem no indice
unico, entao o historico existente nao precisa de letra.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "202609200001"
down_revision: Union[str, None] = "202609110001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tab", sa.Column("label", sa.String(length=20), nullable=True))
    op.create_index(
        "uq_tab_active_label_per_table",
        "tab",
        ["table_id", "label"],
        unique=True,
        postgresql_where=sa.text("label IS NOT NULL AND status IN ('aberta', 'fechada')"),
    )


def downgrade() -> None:
    op.drop_index("uq_tab_active_label_per_table", table_name="tab")
    op.drop_column("tab", "label")