"""Fase 4 (P3) — Programa de fidelidade (pontos).

LoyaltyAccount: saldo de pontos de UM cliente (1:1 com Customer do P1).
LoyaltyTransaction: extrato — cada ganho/resgate vira uma linha, ligada ao
pedido que gerou. O saldo da conta é sempre a soma do extrato (mantido
denormalizado em points_balance pra não somar a cada leitura).

IMPORTANTE (integração com P1): customer_id ainda NÃO tem ForeignKey pra
tabela `customer`, porque essa tabela é criada pela migration do P1. Quando
a migration do Customer estiver na main, basta uma migration pequena
adicionando a FK (ver docs/fase4/P3-cupons-fidelidade.md, seção Integração).
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LoyaltyTransactionType(str, enum.Enum):
    ganho = "ganho"        # pontos creditados por um pedido
    resgate = "resgate"    # pontos usados como desconto num pedido
    estorno = "estorno"    # desfaz ganho/resgate (ex.: pagamento recusado)


class LoyaltyAccount(Base):
    __tablename__ = "loyalty_account"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    # Sem FK por enquanto — ver docstring do módulo.
    customer_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True, index=True)

    points_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lifetime_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    transactions: Mapped[list["LoyaltyTransaction"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan",
        order_by="LoyaltyTransaction.created_at.desc()",
    )


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transaction"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("loyalty_account.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("order.id", ondelete="SET NULL"), nullable=True
    )
    type: Mapped[LoyaltyTransactionType] = mapped_column(
        SAEnum(LoyaltyTransactionType, name="loyalty_transaction_type"), nullable=False
    )
    # Positivo = entrou na conta; negativo = saiu.
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    account: Mapped["LoyaltyAccount"] = relationship(back_populates="transactions")
