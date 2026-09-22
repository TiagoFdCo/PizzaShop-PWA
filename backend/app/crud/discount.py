"""Fase 4 (P3) — Aplica cupom + pontos num pedido recém-criado.

Chamado por app/crud/order.py::create_order DEPOIS do db.flush() do pedido
(precisa do order.id pro extrato) e ANTES do commit — então se qualquer
regra falhar, o ValueError desfaz tudo: pedido, uso do cupom e pontos.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud import coupon as crud_coupon
from app.crud import loyalty as crud_loyalty
from app.models.loyalty import LoyaltyTransaction, LoyaltyTransactionType
from app.models.order import Order


def apply_order_discounts(
    db: Session,
    order: Order,
    *,
    coupon_code: str | None,
    redeem_points: int,
    customer_id: str | None,
) -> None:
    subtotal = order.subtotal

    # 1) Cupom -------------------------------------------------------------
    coupon_discount = 0.0
    if coupon_code and coupon_code.strip():
        coupon = crud_coupon.get_by_code(db, order.tenant_id, coupon_code, lock=True)
        coupon_discount = crud_coupon.check_coupon(coupon, subtotal)
        assert coupon is not None
        coupon.uses_count += 1
        order.coupon_code = coupon.code

    remaining = round(subtotal - coupon_discount, 2)

    # 2) Resgate de pontos --------------------------------------------------
    loyalty_discount = 0.0
    account = None
    if redeem_points:
        if customer_id is None:
            raise ValueError("Faça login para usar seus pontos de fidelidade")
        if redeem_points % crud_loyalty.REDEEM_BLOCK != 0:
            raise ValueError(f"Os pontos são resgatados em blocos de {crud_loyalty.REDEEM_BLOCK}")
        loyalty_discount = crud_loyalty.points_to_reais(redeem_points)
        if loyalty_discount > remaining:
            raise ValueError("O desconto dos pontos não pode ser maior que o valor dos produtos")
        account = crud_loyalty.get_or_create_account(db, order.tenant_id, customer_id)
        if account.points_balance < redeem_points:
            raise ValueError("Saldo de pontos insuficiente")
        crud_loyalty.add_transaction(
            db, account, LoyaltyTransactionType.resgate, -redeem_points,
            f"Resgate no pedido #{order.id[:8]}", order_id=order.id,
        )

    # 3) Totais (sempre recalculados aqui — o total do front é ignorado) ---
    order.coupon_discount = coupon_discount
    order.loyalty_discount = loyalty_discount
    order.points_redeemed = redeem_points
    order.total = round(subtotal - coupon_discount - loyalty_discount + order.delivery_fee, 2)

    # 4) Ganho de pontos (só cliente logado) --------------------------------
    order.points_earned = 0
    if customer_id is not None:
        earned = crud_loyalty.points_for_amount(subtotal - coupon_discount - loyalty_discount)
        if earned > 0:
            account = account or crud_loyalty.get_or_create_account(db, order.tenant_id, customer_id)
            crud_loyalty.add_transaction(
                db, account, LoyaltyTransactionType.ganho, earned,
                f"Pedido #{order.id[:8]}", order_id=order.id,
            )
            order.points_earned = earned


def revert_order_discounts(db: Session, order: Order) -> None:
    """
    Desfaz o efeito de cupom/pontos de um pedido (ex.: pagamento recusado).
    Idempotente: rodar duas vezes não estorna duas vezes. NÃO faz commit.
    Gancho pro P1 (Pagamento concreto) chamar quando o status virar recusado.
    """
    if order.coupon_code:
        coupon = crud_coupon.get_by_code(db, order.tenant_id, order.coupon_code, lock=True)
        if coupon is not None and coupon.uses_count > 0:
            coupon.uses_count -= 1

    txs = list(db.scalars(select(LoyaltyTransaction).where(LoyaltyTransaction.order_id == order.id)).all())
    if any(t.type == LoyaltyTransactionType.estorno for t in txs):
        return  # já estornado
    for tx in txs:
        account = tx.account
        # Se o cliente já gastou os pontos ganhos, o estorno zera o saldo
        # em vez de deixá-lo negativo.
        points = -tx.points
        if account.points_balance + points < 0:
            points = -account.points_balance
        if points:
            crud_loyalty.add_transaction(
                db, account, LoyaltyTransactionType.estorno, points,
                f"Estorno do pedido #{order.id[:8]}", order_id=order.id,
            )

    order.coupon_code = None
    order.total = round(order.subtotal + order.delivery_fee, 2)
    order.coupon_discount = 0.0
    order.loyalty_discount = 0.0
    order.points_redeemed = 0
    order.points_earned = 0
    # SessionLocal usa autoflush=False: sem este flush, uma 2ª chamada na
    # mesma sessão não enxergaria os estornos acima e estornaria de novo.
    db.flush()
