from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product


def get_popular_products(
    db: Session,
    tenant_id: str,
    exclude_product_id: str | None = None,
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
        .join( 
            popularity_subq, 
            Product.id == popularity_subq.c.product_id, 
        ) 
        .where(Product.tenant_id == tenant_id) 
    ) 
    if exclude_product_id: 
        stmt = stmt.where(Product.id != exclude_product_id)

    stmt = ( 
         stmt 
         .order_by(popularity_subq.c.total_qty.desc()) 
         .limit(limit) 
    )

    products = list(db.scalars(stmt).all())

    # Fallback: se o produto excluído não tem histórico suficiente pra
    # preencher `limit` recomendações (ex.: cardápio novo, poucos pedidos),
    # completa com os produtos mais recentes do cardápio que ainda não
    # entraram na lista — pra nunca devolver menos que o esperado no front.
    if len(products) < limit:
        already_ids = [p.id for p in products] 
        if exclude_product_id: 
            already_ids.append(exclude_product_id)
        fallback_stmt = (
            select(Product)
            .where(Product.tenant_id == tenant_id)
            .where(Product.id.notin_(already_ids))
            .limit(limit - len(products))
        )
        products += list(db.scalars(fallback_stmt).all())

    return products

def get_last_order_products(
    db: Session,
    customer_id: str,
    tenant_id: str,
    limit: int = 4,
) -> list[Product]:
    """
    Retorna os produtos presentes no último pedido realizado pelo cliente.
    """

    last_order_stmt = (
        select(Order.id)
        .where(Order.customer_id == customer_id)
        .where(Order.tenant_id == tenant_id)
        .order_by(Order.created_at.desc())
        .limit(1)
    )

    last_order_id = db.scalar(last_order_stmt)

    if last_order_id is None:
        return []

    products_stmt = (
        select(Product)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .where(OrderItem.order_id == last_order_id)
        .where(Product.tenant_id == tenant_id)
        .limit(limit)
    )

    return list(db.scalars(products_stmt).unique().all())

def get_products_by_weekday(
    db: Session,
    tenant_id: str,
    weekday: int,
    limit: int = 4,
) -> list[Product]:
    """
    Retorna os produtos mais pedidos no dia da semana informado.

    weekday:
        0 = segunda-feira
        1 = terça-feira
        2 = quarta-feira
        3 = quinta-feira
        4 = sexta-feira
        5 = sábado
        6 = domingo
    """

    popularity_subq = (
        select(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_qty"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.tenant_id == tenant_id)
        .where(
            func.extract("isodow", Order.created_at) == weekday + 1
        )
        .group_by(OrderItem.product_id)
        .subquery()
    )

    stmt = (
        select(Product)
        .join(
            popularity_subq,
            Product.id == popularity_subq.c.product_id,
        )
        .where(Product.tenant_id == tenant_id)
        .order_by(popularity_subq.c.total_qty.desc())
        .limit(limit)
    )

    return list(db.scalars(stmt).all())