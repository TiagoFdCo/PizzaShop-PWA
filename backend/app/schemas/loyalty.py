"""Fase 4 (P3) — schemas de fidelidade."""
from datetime import datetime

from app.models.loyalty import LoyaltyTransactionType
from app.schemas.common import CamelModel


class LoyaltyRules(CamelModel):
    """Regras expostas pro front calcular prévia sem hardcodar números."""

    points_per_real: int
    redeem_block: int
    reais_per_block: float


class LoyaltyTransactionOut(CamelModel):
    id: str
    order_id: str | None
    type: LoyaltyTransactionType
    points: int
    description: str
    created_at: datetime


class LoyaltyAccountOut(CamelModel):
    points_balance: int
    lifetime_points: int
    rules: LoyaltyRules
    transactions: list[LoyaltyTransactionOut] = []
