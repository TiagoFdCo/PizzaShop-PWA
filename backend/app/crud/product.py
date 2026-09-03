from sqlalchemy.orm import Session, joinedload

from app.models.product import Product, ProductTopping
from app.schemas.product import ProductInput


def list_products(db: Session, tenant_id: str) -> list[Product]:
    return (
        db.query(Product)
        .options(joinedload(Product.toppings))
        .filter(Product.tenant_id == tenant_id)
        .all()
    )


def get_product(db: Session, product_id: str) -> Product | None:
    return (
        db.query(Product)
        .options(joinedload(Product.toppings))
        .filter(Product.id == product_id)
        .first()
    )


def create_product(db: Session, tenant_id: str, data: ProductInput) -> Product:
    product = Product(
        tenant_id=tenant_id,
        name=data.name,
        description=data.description,
        image_url=data.image_url,
        category=data.category,
        base_price=data.base_price,
        available_sizes=data.available_sizes,
    )
    product.toppings = [ProductTopping(name=t.name, price=t.price) for t in data.available_toppings]
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: ProductInput) -> Product:
    product.name = data.name
    product.description = data.description
    product.image_url = data.image_url
    product.category = data.category
    product.base_price = data.base_price
    product.available_sizes = data.available_sizes
    # Substitui a lista inteira de adicionais — mais simples e suficiente pro
    # tamanho do cardápio deste projeto (evita diff campo-a-campo).
    product.toppings = [ProductTopping(name=t.name, price=t.price) for t in data.available_toppings]
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()
