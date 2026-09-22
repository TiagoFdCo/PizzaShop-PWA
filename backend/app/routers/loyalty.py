"""Fase 4 (P3) — rotas de fidelidade do cliente logado.

GET /loyalty/rules  público  — regras (pontos por real, bloco de resgate)
GET /loyalty/me     cliente  — saldo + extrato (conta vazia se nunca pediu)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import loyalty as crud_loyalty
from app.db.session import get_db
from app.deps_customer import get_required_customer_id
from app.schemas.loyalty import LoyaltyAccountOut, LoyaltyRules, LoyaltyTransactionOut

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


@router.get("/rules", response_model=LoyaltyRules)
def read_rules() -> LoyaltyRules:
    return LoyaltyRules(**crud_loyalty.rules())


@router.get("/me", response_model=LoyaltyAccountOut)
def read_my_account(
    db: Session = Depends(get_db),
    customer_id: str = Depends(get_required_customer_id),
) -> LoyaltyAccountOut:
    account = crud_loyalty.get_account(db, customer_id, with_history=True)
    rules = LoyaltyRules(**crud_loyalty.rules())
    if account is None:
        return LoyaltyAccountOut(points_balance=0, lifetime_points=0, rules=rules, transactions=[])
    return LoyaltyAccountOut(
        points_balance=account.points_balance,
        lifetime_points=account.lifetime_points,
        rules=rules,
        transactions=[LoyaltyTransactionOut.model_validate(t) for t in account.transactions[:50]],
    )
