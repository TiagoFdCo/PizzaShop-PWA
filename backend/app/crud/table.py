"""CRUD do presencial: mesas e comandas. Regra de negócio mora aqui.

Convenção de erro (a rota traduz):
  - retorno None  -> não encontrado (404)
  - raise ConflictError -> violação de regra (409)
"""
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderChannel, OrderItem, OrderItemTopping, OrderStatus, PaymentMethod
from app.models.product import Product
from app.models.table import RestaurantTable, Tab, TableStatus, TabStatus


class ConflictError(Exception):
    """Regra de negócio violada -> a rota devolve 409."""


# ─── Mesas ────────────────────────────────────────────────────────────────────

def list_tables(db: Session, tenant_id: str) -> list[RestaurantTable]:
    stmt = (
        select(RestaurantTable)
        .where(RestaurantTable.tenant_id == tenant_id)
        .order_by(RestaurantTable.number)
    )
    return list(db.scalars(stmt).all())


def create_table(db: Session, tenant_id: str, number: int, seats: int | None) -> RestaurantTable:
    existing = db.scalar(
        select(RestaurantTable).where(
            RestaurantTable.tenant_id == tenant_id,
            RestaurantTable.number == number,
        )
    )
    if existing is not None:
        raise ConflictError(f"Já existe a mesa número {number}.")

    table = RestaurantTable(tenant_id=tenant_id, number=number, seats=seats, status=TableStatus.livre)
    db.add(table)
    db.commit()
    db.refresh(table)
    return table


def set_table_status(db: Session, tenant_id: str, table_id: str, status: TableStatus) -> RestaurantTable | None:
    table = db.get(RestaurantTable, table_id)
    if table is None or table.tenant_id != tenant_id:
        return None
    table.status = status
    db.commit()
    db.refresh(table)
    return table


# ─── Comandas ─────────────────────────────────────────────────────────────────

def _get_tab(db: Session, tab_id: str, tenant_id: str) -> Tab | None:
    stmt = (
        select(Tab)
        .options(
            selectinload(Tab.table),
            selectinload(Tab.waiter),
            selectinload(Tab.orders).selectinload(Order.items).selectinload(OrderItem.toppings),
        )
        .where(Tab.id == tab_id)
    )
    tab = db.scalar(stmt)
    if tab is None or tab.tenant_id != tenant_id:
        return None
    return tab


def open_tab(db: Session, tenant_id: str, table_id: str, waiter_id: str) -> Tab | None:
    table = db.get(RestaurantTable, table_id)
    if table is None or table.tenant_id != tenant_id:
        return None  # 404: mesa não existe

    # REGRA (D7 / MVP): só uma comanda 'aberta' por mesa
    open_exists = db.scalar(
        select(Tab).where(Tab.table_id == table_id, Tab.status == TabStatus.aberta)
    )
    if open_exists is not None:
        raise ConflictError("Mesa já tem uma comanda aberta.")

    tab = Tab(tenant_id=tenant_id, table_id=table_id, waiter_id=waiter_id, status=TabStatus.aberta, total=0.0)
    db.add(tab)
    table.status = TableStatus.ocupada
    db.commit()
    return _get_tab(db, tab.id, tenant_id)


def list_tabs(db: Session, tenant_id: str, status: TabStatus | None = None) -> list[Tab]:
    stmt = (
        select(Tab)
        .options(
            selectinload(Tab.table),
            selectinload(Tab.waiter),
            selectinload(Tab.orders).selectinload(Order.items).selectinload(OrderItem.toppings),
        )
        .where(Tab.tenant_id == tenant_id)
        .order_by(Tab.opened_at.desc())
    )
    if status is not None:
        stmt = stmt.where(Tab.status == status)
    return list(db.scalars(stmt).unique().all())


def get_tab(db: Session, tenant_id: str, tab_id: str) -> Tab | None:
    return _get_tab(db, tab_id, tenant_id)


def add_order_to_tab(db: Session, tenant_id: str, tab_id: str, items: list) -> Tab | None:
    tab = _get_tab(db, tab_id, tenant_id)
    if tab is None:
        return None
    if tab.status != TabStatus.aberta:
        raise ConflictError("Só dá pra lançar em comanda aberta.")

    subtotal = 0.0
    order = Order(
        tenant_id=tenant_id,
        # Pedido presencial: sem cliente cadastrado -> rótulo da mesa.
        customer_name=f"Mesa {tab.table.number}",
        customer_address="Consumo no local",
        customer_phone="",
        payment_method=PaymentMethod.dinheiro,  # placeholder; pagamento real é no /pay da comanda
        subtotal=0.0,
        delivery_fee=0.0,
        total=0.0,
        status=OrderStatus.recebido,
        channel=OrderChannel.dine_in,
        tab_id=tab.id,
        table_id=tab.table_id,
        waiter_id=tab.waiter_id,
    )
    db.add(order)
    db.flush()

    for item_data in items:
        toppings_total = sum(t.price for t in item_data.toppings)
        line_total = (item_data.unit_price + toppings_total) * item_data.quantity
        subtotal += line_total

        product = db.get(Product, item_data.product_id)
        cost = product.cost if product is not None else 0.0

        item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            name=item_data.name,
            image_url=item_data.image_url,
            size=item_data.size,
            unit_price=item_data.unit_price,
            cost=cost,  # snapshot do custo (D1)
            quantity=item_data.quantity,
            notes=item_data.notes,
        )
        db.add(item)
        db.flush()

        for topping_data in item_data.toppings:
            db.add(OrderItemTopping(order_item_id=item.id, name=topping_data.name, price=topping_data.price))

    order.subtotal = subtotal
    order.total = subtotal  # presencial não tem taxa de entrega
    tab.total = (tab.total or 0.0) + order.total

    db.commit()
    return _get_tab(db, tab.id, tenant_id)


def close_tab(db: Session, tenant_id: str, tab_id: str) -> Tab | None:
    tab = _get_tab(db, tab_id, tenant_id)
    if tab is None:
        return None
    if tab.status != TabStatus.aberta:
        raise ConflictError("Só dá pra fechar comanda aberta.")
    from datetime import datetime, timezone
    tab.status = TabStatus.fechada
    tab.closed_at = datetime.now(timezone.utc)
    db.commit()
    return _get_tab(db, tab.id, tenant_id)


def pay_tab(db: Session, tenant_id: str, tab_id: str) -> Tab | None:
    tab = _get_tab(db, tab_id, tenant_id)
    if tab is None:
        return None
    if tab.status == TabStatus.paga:
        raise ConflictError("Comanda já está paga.")

    from datetime import datetime, timezone
    tab.status = TabStatus.paga
    if tab.closed_at is None:
        tab.closed_at = datetime.now(timezone.utc)

    # Libera a mesa se não sobrar comanda ativa (aberta/fechada) nela.
    ativos = db.scalar(
        select(Tab).where(
            Tab.table_id == tab.table_id,
            Tab.id != tab.id,
            Tab.status.in_([TabStatus.aberta, TabStatus.fechada]),
        )
    )
    if ativos is None:
        table = db.get(RestaurantTable, tab.table_id)
        if table is not None:
            table.status = TableStatus.livre

    db.commit()
    return _get_tab(db, tab.id, tenant_id)
