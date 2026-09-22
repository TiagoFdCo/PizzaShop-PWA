"""Fase 4 (P3) — rotas de cupom.

POST /coupons/validate   público  — checkout confere o cupom antes de pagar
GET  /coupons            admin    — lista
POST /coupons            admin    — cria
PATCH /coupons/{id}      admin    — ativa/desativa, muda validade/limite
DELETE /coupons/{id}     admin    — remove
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import coupon as crud_coupon
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import StaffRole
from app.schemas.coupon import CouponInput, CouponOut, CouponUpdate, CouponValidateInput, CouponValidateOut

router = APIRouter(prefix="/coupons", tags=["coupons"])


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return tenant.id


@router.post("/validate", response_model=CouponValidateOut, summary="Valida cupom no checkout — sem autenticação")
def validate_coupon(data: CouponValidateInput, db: Session = Depends(get_db)) -> CouponValidateOut:
    try:
        coupon, discount = crud_coupon.validate_coupon(db, _tenant_id(db), data.code, data.subtotal)
    except ValueError as error:
        code = status.HTTP_404_NOT_FOUND if "não encontrado" in str(error) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=str(error)) from error
    return CouponValidateOut(
        code=coupon.code,
        description=coupon.description,
        discount_type=coupon.discount_type,
        value=coupon.value,
        discount=discount,
    )


@router.get("", response_model=list[CouponOut])
def list_coupons(
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> list[CouponOut]:
    return [CouponOut.model_validate(c) for c in crud_coupon.list_coupons(db, _tenant_id(db))]


@router.post("", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
def create_coupon(
    data: CouponInput,
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> CouponOut:
    try:
        coupon = crud_coupon.create_coupon(db, _tenant_id(db), data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return CouponOut.model_validate(coupon)


@router.patch("/{coupon_id}", response_model=CouponOut)
def update_coupon(
    coupon_id: str,
    data: CouponUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> CouponOut:
    coupon = crud_coupon.update_coupon(db, _tenant_id(db), coupon_id, data)
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cupom não encontrado")
    return CouponOut.model_validate(coupon)


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(require_role([StaffRole.admin])),
) -> None:
    if not crud_coupon.delete_coupon(db, _tenant_id(db), coupon_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cupom não encontrado")
