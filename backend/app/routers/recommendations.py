from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.recommendation import (
    get_last_order_products,
    get_popular_products,
    get_products_by_weekday,
)
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import get_current_customer
from app.models.customer import Customer
from app.schemas.recommendation import ProductRecommendationOut


router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"],
)


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant não configurado",
        )

    return tenant.id


@router.get(
    "/last-order",
    response_model=list[ProductRecommendationOut],
)
def read_last_order_recommendations(
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> list[ProductRecommendationOut]:
    """
    Retorna produtos do último pedido realizado pelo cliente autenticado.
    """

    products = get_last_order_products(
        db=db,
        customer_id=customer.id,
        tenant_id=_tenant_id(db),
        limit=4,
    )

    return [
        ProductRecommendationOut.model_validate(product)
        for product in products
    ]


@router.get(
    "/weekday",
    response_model=list[ProductRecommendationOut],
)
def read_weekday_recommendations(
    db: Session = Depends(get_db),
) -> list[ProductRecommendationOut]:
    """
    Retorna os produtos mais pedidos no dia da semana atual.

    Se não houver histórico para o dia atual, utiliza a popularidade geral
    como fallback.
    """

    tenant_id = _tenant_id(db)

    weekday = datetime.now(timezone.utc).weekday()

    products = get_products_by_weekday(
        db=db,
        tenant_id=tenant_id,
        weekday=weekday,
        limit=4,
    )

    if not products:
        products = get_popular_products(
            db=db,
            tenant_id=tenant_id,
            limit=4,
        )

    return [
        ProductRecommendationOut.model_validate(product)
        for product in products
    ]