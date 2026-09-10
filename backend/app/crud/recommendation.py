from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.order import OrderItem
from app.models.product import Product


def get_popular_products(
    db: Session,
    tenant_id: str,
    exclude_product_id: str,
    limit: int = 4,
) -> list[Product]:
    """
    Recomendação simples por popularidade: produtos mais pedidos no geral
    (soma de quantity em order_item), excluindo o produto atual. Não cruza
    com o carrinho da sessão nem com histórico do cliente — é o mesmo
    ranking pra todo mundo (D5 do plano: escopo simples pro crunch).
    """
    popularity_subq = (
        select(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_qty"),
        )
        .group_by(OrderItem.product_id)
        .subquery()
    )

    stmt = (
        select(Product)
        .join(popularity_subq, Product.id == popularity_subq.c.product_id)
        .where(Product.tenant_id == tenant_id)
        .where(Product.id != exclude_product_id)
        .order_by(popularity_subq.c.total_qty.desc())
        .limit(limit)
    )

    products = list(db.scalars(stmt).all())

    # Fallback: se o produto excluído não tem histórico suficiente pra
    # preencher `limit` recomendações (ex.: cardápio novo, poucos pedidos),
    # completa com os produtos mais recentes do cardápio que ainda não
    # entraram na lista — pra nunca devolver menos que o esperado no front.
    if len(products) < limit:
        already_ids = [p.id for p in products] + [exclude_product_id]
        fallback_stmt = (
            select(Product)
            .where(Product.tenant_id == tenant_id)
            .where(Product.id.notin_(already_ids))
            .limit(limit - len(products))
        )
        products += list(db.scalars(fallback_stmt).all())

    return products