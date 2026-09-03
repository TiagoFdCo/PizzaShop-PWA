from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.order import (
    claim_order,
    create_order,
    dispatch_order,
    get_order,
    list_orders,
    mark_delivered,
    mark_failed,
    mark_ready,
)
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import get_current_staff, require_role
from app.models.order import Order
from app.models.staff import Staff, StaffRole
from app.schemas.order import (
    DeliveryFailureInput,
    DispatchInput,
    OrderInput,
    OrderOut,
)

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant não configurado",
        )

    return tenant.id


def _order_to_out(order: Order) -> OrderOut:
    return OrderOut.model_validate(
        {
            "id": order.id,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "name": item.name,
                    "image_url": item.image_url,
                    "size": item.size,
                    "unit_price": item.unit_price,
                    "quantity": item.quantity,
                    "notes": item.notes,
                    "toppings": [
                        {
                            "id": topping.id,
                            "name": topping.name,
                            "price": topping.price,
                        }
                        for topping in item.toppings
                    ],
                }
                for item in order.items
            ],
            "customer": {
                "name": order.customer_name,
                "address": order.customer_address,
                "phone": order.customer_phone,
            },
            "payment_method": order.payment_method,
            "subtotal": order.subtotal,
            "delivery_fee": order.delivery_fee,
            "total": order.total,
            "status": order.status,
            "created_at": order.created_at,
            "cook": (
                {
                    "id": order.cook.id,
                    "name": order.cook.name,
                }
                if order.cook
                else None
            ),
            "driver": (
                {
                    "id": order.driver.id,
                    "name": order.driver.name,
                }
                if order.driver
                else None
            ),
            "delivery_failure": (
                {
                    "reason": order.delivery_failure.reason,
                    "description": order.delivery_failure.description,
                    "reported_at": order.delivery_failure.reported_at,
                }
                if order.delivery_failure
                else None
            ),
        }
    )


def _handle_order_error(error: ValueError) -> HTTPException:
    message = str(error)

    if "não encontrado" in message.lower():
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )

    if "não está atribuído" in message.lower():
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
        )

    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message,
    )


@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
)
def add_order(
    data: OrderInput,
    db: Session = Depends(get_db),
) -> OrderOut:

    tenant_id = _tenant_id(db)

    try:
        order = create_order(
            db,
            tenant_id,
            data,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)


@router.get(
    "",
    response_model=list[OrderOut],
)
def read_orders(
    db: Session = Depends(get_db),
    staff: Staff = Depends(get_current_staff),
) -> list[OrderOut]:

    tenant_id = _tenant_id(db)

    orders = list_orders(
        db,
        tenant_id,
        staff,
    )

    return [
        _order_to_out(order)
        for order in orders
    ]


@router.get(
    "/{order_id}",
    response_model=OrderOut,
)
def read_order(
    order_id: str,
    db: Session = Depends(get_db),
    staff: Staff = Depends(get_current_staff),
) -> OrderOut:

    tenant_id = _tenant_id(db)

    try:
        order = get_order(
            db,
            order_id,
            tenant_id,
            staff,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)


@router.patch(
    "/{order_id}/claim",
    response_model=OrderOut,
)
def claim_order_route(
    order_id: str,
    db: Session = Depends(get_db),
    cook: Staff = Depends(
        require_role([StaffRole.cozinha])
    ),
) -> OrderOut:

    try:
        order = claim_order(
            db,
            order_id,
            cook,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)


@router.patch(
    "/{order_id}/ready",
    response_model=OrderOut,
)
def ready_order_route(
    order_id: str,
    db: Session = Depends(get_db),
    _cook: Staff = Depends(
        require_role([StaffRole.cozinha])
    ),
) -> OrderOut:

    try:
        order = mark_ready(
            db,
            order_id,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)


@router.patch(
    "/{order_id}/dispatch",
    response_model=OrderOut,
)
def dispatch_order_route(
    order_id: str,
    data: DispatchInput,
    db: Session = Depends(get_db),
    _cook: Staff = Depends(
        require_role([StaffRole.cozinha])
    ),
) -> OrderOut:

    try:
        order = dispatch_order(
            db,
            order_id,
            data.driver_id,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)


@router.patch(
    "/{order_id}/delivered",
    response_model=OrderOut,
)
def delivered_order_route(
    order_id: str,
    db: Session = Depends(get_db),
    driver: Staff = Depends(
        require_role([StaffRole.entrega])
    ),
) -> OrderOut:

    try:
        order = mark_delivered(
            db,
            order_id,
            driver,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)


@router.patch(
    "/{order_id}/failed",
    response_model=OrderOut,
)
def failed_order_route(
    order_id: str,
    data: DeliveryFailureInput,
    db: Session = Depends(get_db),
    driver: Staff = Depends(
        require_role([StaffRole.entrega])
    ),
) -> OrderOut:

    try:
        order = mark_failed(
            db,
            order_id,
            data,
            driver,
        )
    except ValueError as error:
        raise _handle_order_error(error) from error

    return _order_to_out(order)
