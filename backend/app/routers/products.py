from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.product import create_product, delete_product, get_product, list_products, update_product
from app.crud.recommendation import get_popular_products
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import StaffRole
from app.schemas.product import ProductInput, ProductOut
from app.schemas.recommendation import ProductRecommendationOut

router = APIRouter(prefix="/products", tags=["products"])


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return tenant.id


@router.get("", response_model=list[ProductOut])
def read_products(db: Session = Depends(get_db)) -> list[ProductOut]:
    return [ProductOut.model_validate(p) for p in list_products(db, _tenant_id(db))]


@router.get("/{product_id}", response_model=ProductOut)
def read_product(product_id: str, db: Session = Depends(get_db)) -> ProductOut:
    """Retorna um produto pelo ID — usado pela tela de detalhe da pizza."""
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return ProductOut.model_validate(product)


@router.get("/{product_id}/recommendations", response_model=list[ProductRecommendationOut])
def read_product_recommendations(
    product_id: str,
    db: Session = Depends(get_db),
) -> list[ProductRecommendationOut]:
    """
    Recomendação pública (sem auth) — "quem viu esse produto também pediu".
    Popularidade geral (soma de quantity em order_item), excluindo o
    produto atual. Ver app/crud/recommendation.py para a regra completa,
    incluindo o fallback para cardápios com pouco histórico.
    """
    tenant_id = _tenant_id(db)

    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")

    recommended = get_popular_products(db, tenant_id, exclude_product_id=product_id, limit=4)

    return [ProductRecommendationOut.model_validate(p) for p in recommended]


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def add_product(
    data: ProductInput,
    db: Session = Depends(get_db),
    _admin=Depends(require_role([StaffRole.admin])),
) -> ProductOut:
    product = create_product(db, _tenant_id(db), data)
    return ProductOut.model_validate(product)


@router.put("/{product_id}", response_model=ProductOut)
def edit_product(
    product_id: str,
    data: ProductInput,
    db: Session = Depends(get_db),
    _admin=Depends(require_role([StaffRole.admin])),
) -> ProductOut:
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    product = update_product(db, product, data)
    return ProductOut.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(
    product_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_role([StaffRole.admin])),
) -> None:
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    delete_product(db, product)