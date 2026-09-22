"""Fase 4 (P3) — CRUD e regras de validação de cupom."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.coupon import Coupon, CouponDiscountType
from app.schemas.coupon import CouponInput, CouponUpdate, normalize_code


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    """Datas vindas do front sem fuso são tratadas como UTC."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# ---------- Admin ----------

def list_coupons(db: Session, tenant_id: str) -> list[Coupon]:
    stmt = select(Coupon).where(Coupon.tenant_id == tenant_id).order_by(Coupon.created_at.desc())
    return list(db.scalars(stmt).all())


def get_by_code(db: Session, tenant_id: str, code: str, *, lock: bool = False) -> Coupon | None:
    stmt = select(Coupon).where(Coupon.tenant_id == tenant_id, Coupon.code == normalize_code(code))
    if lock:
        # Trava a linha até o commit: dois pedidos simultâneos não conseguem
        # estourar o max_uses do mesmo cupom.
        stmt = stmt.with_for_update()
    return db.scalar(stmt)


def create_coupon(db: Session, tenant_id: str, data: CouponInput) -> Coupon:
    if get_by_code(db, tenant_id, data.code) is not None:
        raise ValueError("Já existe um cupom com este código")
    coupon = Coupon(
        tenant_id=tenant_id,
        code=data.code,
        description=data.description,
        discount_type=data.discount_type,
        value=data.value,
        min_order_value=data.min_order_value,
        valid_from=_aware(data.valid_from) if data.valid_from else _now(),
        valid_until=_aware(data.valid_until) if data.valid_until else None,
        max_uses=data.max_uses,
        active=data.active,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


def update_coupon(db: Session, tenant_id: str, coupon_id: str, data: CouponUpdate) -> Coupon | None:
    coupon = db.get(Coupon, coupon_id)
    if coupon is None or coupon.tenant_id != tenant_id:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "valid_until" in changes and changes["valid_until"] is not None:
        changes["valid_until"] = _aware(changes["valid_until"])
    for field, value in changes.items():
        setattr(coupon, field, value)
    db.commit()
    db.refresh(coupon)
    return coupon


def delete_coupon(db: Session, tenant_id: str, coupon_id: str) -> bool:
    coupon = db.get(Coupon, coupon_id)
    if coupon is None or coupon.tenant_id != tenant_id:
        return False
    db.delete(coupon)
    db.commit()
    return True


# ---------- Regras ----------

def compute_discount(coupon: Coupon, subtotal: float) -> float:
    """Desconto em R$ sobre o subtotal. Nunca maior que o próprio subtotal."""
    if coupon.discount_type == CouponDiscountType.percentual:
        discount = subtotal * coupon.value / 100
    else:
        discount = coupon.value
    return round(min(discount, subtotal), 2)


def check_coupon(coupon: Coupon | None, subtotal: float, now: datetime | None = None) -> float:
    """
    Confere todas as regras e devolve o desconto. Lança ValueError com a
    mensagem que vai direto pro cliente. A ordem das checagens importa:
    a mensagem mostrada é a do primeiro problema encontrado.
    """
    now = now or _now()
    if coupon is None:
        raise ValueError("Cupom não encontrado")
    if not coupon.active:
        raise ValueError("Cupom desativado")
    if _aware(coupon.valid_from) > now:
        raise ValueError("Cupom ainda não está válido")
    if coupon.valid_until is not None and _aware(coupon.valid_until) < now:
        raise ValueError("Cupom expirado")
    if coupon.max_uses is not None and coupon.uses_count >= coupon.max_uses:
        raise ValueError("Cupom esgotado")
    if subtotal < coupon.min_order_value:
        falta = coupon.min_order_value - subtotal
        raise ValueError(
            f"Este cupom exige pedido mínimo de R$ {coupon.min_order_value:.2f} "
            f"(faltam R$ {falta:.2f})".replace(".", ",")
        )
    return compute_discount(coupon, subtotal)


def validate_coupon(db: Session, tenant_id: str, code: str, subtotal: float) -> tuple[Coupon, float]:
    """Usado pelo POST /coupons/validate (só consulta, não consome uso)."""
    coupon = get_by_code(db, tenant_id, code)
    discount = check_coupon(coupon, subtotal)
    assert coupon is not None
    return coupon, discount
