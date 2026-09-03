from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.product import create_product, delete_product, get_product, list_products, update_product
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import StaffRole
from app.schemas.product import ProductInput, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return tenant.id


@router.get("", response_model=list[ProductOut])
def read_products(db: Session = Depends(get_db)) -> list[ProductOut]:
    return [ProductOut.model_validate(p) for p in list_products(db, _tenant_id(db))]


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
