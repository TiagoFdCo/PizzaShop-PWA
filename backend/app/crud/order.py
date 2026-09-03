from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import (
    DeliveryFailure,
    Order,
    OrderItem,
    OrderItemTopping,
    OrderStatus,
)
from app.models.staff import Staff, StaffRole
from app.schemas.order import DeliveryFailureInput, OrderInput


def _get_order(db: Session, order_id: str) -> Order:
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.toppings),
            selectinload(Order.cook),
            selectinload(Order.driver),
            selectinload(Order.delivery_failure),
        )
        .where(Order.id == order_id)
    )

    order = db.scalar(stmt)

    if order is None:
        raise ValueError("Pedido não encontrado.")

    return order


def create_order(db: Session, tenant_id: str, data: OrderInput) -> Order:
    order = Order(
        tenant_id=tenant_id,
        customer_name=data.customer.name,
        customer_address=data.customer.address,
        customer_phone=data.customer.phone,
        payment_method=data.payment_method,
        subtotal=data.subtotal,
        delivery_fee=data.delivery_fee,
        total=data.total,
        status=OrderStatus.recebido,
    )

    db.add(order)
    db.flush()

    for item_data in data.items:
        item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            name=item_data.name,
            image_url=item_data.image_url,
            size=item_data.size,
            unit_price=item_data.unit_price,
            quantity=item_data.quantity,
            notes=item_data.notes,
        )

        db.add(item)
        db.flush()

        for topping_data in item_data.toppings:
            topping = OrderItemTopping(
                order_item_id=item.id,
                name=topping_data.name,
                price=topping_data.price,
            )

            db.add(topping)

    db.commit()

    return _get_order(db, order.id)


def list_orders(
    db: Session,
    tenant_id: str,
    staff: Staff,
) -> list[Order]:

    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.toppings),
            selectinload(Order.cook),
            selectinload(Order.driver),
            selectinload(Order.delivery_failure),
        )
        .where(Order.tenant_id == tenant_id)
        .order_by(Order.created_at.desc())
    )

    if staff.role == StaffRole.entrega:
        stmt = stmt.where(Order.driver_id == staff.id)

    return list(db.scalars(stmt).unique().all())


def get_order(
    db: Session,
    order_id: str,
    tenant_id: str,
    staff: Staff,
) -> Order:

    order = _get_order(db, order_id)

    if order.tenant_id != tenant_id:
        raise ValueError("Pedido não encontrado.")

    if staff.role == StaffRole.entrega and order.driver_id != staff.id:
        raise ValueError("Este pedido não está atribuído a você.")

    return order


def claim_order(
    db: Session,
    order_id: str,
    cook: Staff,
) -> Order:

    order = _get_order(db, order_id)

    if order.status != OrderStatus.recebido:
        raise ValueError(
            "Somente pedidos recebidos podem ser assumidos."
        )

    order.status = OrderStatus.preparo
    order.cook_id = cook.id

    db.commit()

    return _get_order(db, order.id)


def mark_ready(
    db: Session,
    order_id: str,
) -> Order:

    order = _get_order(db, order_id)

    if order.status != OrderStatus.preparo:
        raise ValueError(
            "Somente pedidos em preparo podem ser marcados como prontos."
        )

    order.status = OrderStatus.pronto_entrega

    db.commit()

    return _get_order(db, order.id)


def dispatch_order(
    db: Session,
    order_id: str,
    driver_id: str,
) -> Order:

    order = _get_order(db, order_id)

    if order.status != OrderStatus.pronto_entrega:
        raise ValueError(
            "Somente pedidos prontos para entrega podem ser despachados."
        )

    driver = db.get(Staff, driver_id)

    if driver is None:
        raise ValueError("Entregador não encontrado.")

    if driver.role != StaffRole.entrega:
        raise ValueError(
            "O funcionário selecionado não é um entregador."
        )

    order.driver_id = driver.id
    order.status = OrderStatus.saiu_para_entrega

    db.commit()

    return _get_order(db, order.id)


def mark_delivered(
    db: Session,
    order_id: str,
    driver: Staff,
) -> Order:

    order = _get_order(db, order_id)

    if order.status != OrderStatus.saiu_para_entrega:
        raise ValueError(
            "Somente pedidos que saíram para entrega "
            "podem ser marcados como entregues."
        )

    if order.driver_id != driver.id:
        raise ValueError(
            "Este pedido não está atribuído a você."
        )

    order.status = OrderStatus.entregue

    db.commit()

    return _get_order(db, order.id)


def mark_failed(
    db: Session,
    order_id: str,
    data: DeliveryFailureInput,
    driver: Staff,
) -> Order:

    order = _get_order(db, order_id)

    if order.status != OrderStatus.saiu_para_entrega:
        raise ValueError(
            "Somente pedidos que saíram para entrega "
            "podem ter falha registrada."
        )

    if order.driver_id != driver.id:
        raise ValueError(
            "Este pedido não está atribuído a você."
        )

    if order.delivery_failure is not None:
        raise ValueError(
            "Este pedido já possui uma falha de entrega registrada."
        )

    failure = DeliveryFailure(
        order_id=order.id,
        reason=data.reason,
        description=data.description,
    )

    db.add(failure)

    order.status = OrderStatus.falha_entrega

    db.commit()

    return _get_order(db, order.id)
