"""Fase 4 (P3) — schemas de cupom."""
import re
from datetime import datetime

from pydantic import Field, field_validator, model_validator

from app.models.coupon import CouponDiscountType
from app.schemas.common import CamelModel

_CODE_RE = re.compile(r"^[A-Z0-9_-]{3,30}$")


def normalize_code(value: str) -> str:
    return value.strip().upper()


class CouponInput(CamelModel):
    """Payload de POST /coupons (admin)."""

    code: str
    description: str = ""
    discount_type: CouponDiscountType
    value: float = Field(gt=0)
    min_order_value: float = Field(default=0, ge=0)
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    max_uses: int | None = Field(default=None, ge=1)
    active: bool = True

    @field_validator("code")
    @classmethod
    def _code(cls, value: str) -> str:
        value = normalize_code(value)
        if not _CODE_RE.match(value):
            raise ValueError("Código deve ter 3 a 30 caracteres: letras, números, _ ou -")
        return value

    @model_validator(mode="after")
    def _rules(self) -> "CouponInput":
        if self.discount_type == CouponDiscountType.percentual and self.value > 100:
            raise ValueError("Desconto percentual não pode passar de 100%")
        if self.valid_from and self.valid_until and self.valid_until <= self.valid_from:
            raise ValueError("A data final da validade deve ser depois da data inicial")
        return self


class CouponUpdate(CamelModel):
    """Payload de PATCH /coupons/{id} (admin) — só os campos editáveis com segurança."""

    description: str | None = None
    valid_until: datetime | None = None
    max_uses: int | None = Field(default=None, ge=1)
    active: bool | None = None


class CouponOut(CamelModel):
    id: str
    code: str
    description: str
    discount_type: CouponDiscountType
    value: float
    min_order_value: float
    valid_from: datetime
    valid_until: datetime | None
    max_uses: int | None
    uses_count: int
    active: bool
    created_at: datetime


class CouponValidateInput(CamelModel):
    """Payload de POST /coupons/validate (público, usado no checkout)."""

    code: str
    subtotal: float = Field(ge=0)

    @field_validator("code")
    @classmethod
    def _code(cls, value: str) -> str:
        return normalize_code(value)


class CouponValidateOut(CamelModel):
    code: str
    description: str
    discount_type: CouponDiscountType
    value: float
    discount: float  # valor em R$ que sai do subtotal informado
