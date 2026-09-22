"""Fase 4 (P3) — Regras e persistência do programa de fidelidade.

Regras (todas aqui, num lugar só — mudar aqui muda no front também, porque
GET /loyalty/me devolve estes números em `rules`):

  * GANHO:   1 ponto a cada R$ 1,00 do valor PAGO em produtos
             (subtotal - descontos; taxa de entrega não conta). Arredonda
             pra baixo: R$ 57,90 -> 57 pontos.
  * RESGATE: em blocos de 100 pontos; cada bloco vale R$ 10,00 de desconto.
             O desconto não pode passar do subtotal que sobrou depois do cupom.
  * Pontos de um pedido são creditados na criação do pedido (junto com o
    débito dos pontos resgatados). Se o pagamento for recusado, o P1 chama
    revert_order_discounts() em app/crud/discount.py pra estornar.
"""
import math

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction, LoyaltyTransactionType

POINTS_PER_REAL = 1
REDEEM_BLOCK = 100
REAIS_PER_BLOCK = 10.0


def rules() -> dict:
    return {
        "points_per_real": POINTS_PER_REAL,
        "redeem_block": REDEEM_BLOCK,
        "reais_per_block": REAIS_PER_BLOCK,
    }


def points_for_amount(amount_paid: float) -> int:
    # round() antes do floor evita 57.99999 virar 57 por erro de float.
    return max(0, math.floor(round(amount_paid, 2) * POINTS_PER_REAL))


def points_to_reais(points: int) -> float:
    return round(points / REDEEM_BLOCK * REAIS_PER_BLOCK, 2)


def get_account(db: Session, customer_id: str, *, with_history: bool = False, lock: bool = False) -> LoyaltyAccount | None:
    stmt = select(LoyaltyAccount).where(LoyaltyAccount.customer_id == customer_id)
    if with_history:
        stmt = stmt.options(selectinload(LoyaltyAccount.transactions))
    if lock:
        stmt = stmt.with_for_update()
    return db.scalar(stmt)


def get_or_create_account(db: Session, tenant_id: str, customer_id: str) -> LoyaltyAccount:
    account = get_account(db, customer_id, lock=True)
    if account is None:
        account = LoyaltyAccount(tenant_id=tenant_id, customer_id=customer_id, points_balance=0, lifetime_points=0)
        db.add(account)
        db.flush()
    return account


def add_transaction(
    db: Session,
    account: LoyaltyAccount,
    type_: LoyaltyTransactionType,
    points: int,
    description: str,
    order_id: str | None = None,
) -> LoyaltyTransaction:
    """Grava a linha do extrato e atualiza o saldo. NÃO faz commit."""
    if points == 0:
        raise ValueError("Transação de fidelidade sem pontos")
    if account.points_balance + points < 0:
        raise ValueError("Saldo de pontos insuficiente")
    account.points_balance += points
    if type_ == LoyaltyTransactionType.ganho:
        account.lifetime_points += points
    elif type_ == LoyaltyTransactionType.estorno and points < 0:
        # estorno de um ganho: tira também do acumulado histórico
        account.lifetime_points = max(0, account.lifetime_points + points)
    tx = LoyaltyTransaction(
        account_id=account.id, order_id=order_id, type=type_, points=points, description=description
    )
    db.add(tx)
    return tx
