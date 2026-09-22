import uuid

import mercadopago
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.order import Order, OrderItem, PaymentMethod
from app.models.payment import Payment, PaymentStatus

# Status do Mercado Pago -> nosso enum interno. Qualquer status não listado
# (in_process, authorized, etc.) cai em "pendente" — ainda não é uma decisão
# final, só ainda-não-aprovado.
_MP_STATUS_MAP: dict[str, PaymentStatus] = {
    "approved": PaymentStatus.aprovado,
    "rejected": PaymentStatus.recusado,
    "cancelled": PaymentStatus.recusado,
    "refunded": PaymentStatus.recusado,
    "charged_back": PaymentStatus.recusado,
}


class PaymentConfigError(ValueError):
    """Credenciais do Mercado Pago não configuradas — ver .env.example."""


def _sdk() -> mercadopago.SDK:
    if not settings.MP_ACCESS_TOKEN:
        raise PaymentConfigError(
            "MP_ACCESS_TOKEN não configurado. Gere um Access Token de teste em "
            "https://www.mercadopago.com.br/developers/panel/app e coloque no .env "
            "(veja docs/fase4/P1-pagamento-concreto.md)."
        )
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def get_by_order(db: Session, order_id: str) -> Payment | None:
    stmt = select(Payment).where(Payment.order_id == order_id)
    return db.scalar(stmt)


def _load_order_with_items(db: Session, order_id: str) -> Order | None:
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.toppings)).where(Order.id == order_id)
    return db.scalar(stmt)


def _new_transaction_id() -> str:
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


def _build_preference(order: Order) -> dict:
    items = [
        {
            "title": f"{item.name} ({item.size})",
            "quantity": item.quantity,
            "unit_price": round(item.unit_price, 2),
            "currency_id": "BRL",
        }
        for item in order.items
    ]
    if order.delivery_fee:
        items.append(
            {
                "title": "Taxa de entrega",
                "quantity": 1,
                "unit_price": round(order.delivery_fee, 2),
                "currency_id": "BRL",
            }
        )

    return_url = f"{settings.FRONTEND_URL.rstrip('/')}/pagamento"
    return {
        "items": items,
        "payer": {"name": order.customer_name},
        "external_reference": order.id,
        "back_urls": {
            "success": return_url,
            "pending": return_url,
            "failure": return_url,
        },
        "auto_return": "approved",
        "notification_url": f"{settings.BACKEND_URL.rstrip('/')}/payments/webhook",
    }


def create_or_retry_payment(db: Session, order_id: str) -> tuple[Payment, str | None]:
    """
    Cria (ou reinicia, em retry) o pagamento de um pedido.

    - `dinheiro` (pagar na entrega): não existe o que cobrar num gateway —
      aprova localmente na hora, sem chamar o Mercado Pago. `init_point`
      volta `None` (não há pra onde redirecionar).
    - `pix`/`cartao`: cria uma preferência nova no Mercado Pago (Checkout
      Pro) e devolve a URL de checkout (`init_point`) pro front redirecionar
      o navegador. O status real só chega depois, pelo webhook
      (`handle_webhook`) — aqui o `Payment` fica `pendente`.

    Retorna `(payment, init_point)` — `init_point` é `None` quando não há
    redirecionamento (dinheiro, ou retry de um pagamento já aprovado).
    """
    order = _load_order_with_items(db, order_id)
    if order is None:
        raise ValueError("Pedido não encontrado.")

    payment = get_by_order(db, order_id)
    if payment is not None and payment.status == PaymentStatus.aprovado:
        return payment, None  # já aprovado — nada a refazer, sem novo redirect

    if order.payment_method == PaymentMethod.dinheiro:
        if payment is None:
            payment = Payment(order_id=order.id, method=order.payment_method)
            db.add(payment)
        payment.method = order.payment_method
        payment.status = PaymentStatus.aprovado
        payment.transaction_id = f"CASH-{uuid.uuid4().hex[:10].upper()}"
        payment.mp_preference_id = None
        payment.mp_payment_id = None
        db.commit()
        db.refresh(payment)
        return payment, None

    sdk = _sdk()
    response = sdk.preference().create(_build_preference(order))
    if response.get("status") not in (200, 201):
        detail = (response.get("response") or {}).get("message", "erro desconhecido")
        raise ValueError(f"Mercado Pago recusou a criação da preferência: {detail}")

    preference = response["response"]
    init_point = preference.get("init_point") or preference.get("sandbox_init_point")

    if payment is None:
        payment = Payment(order_id=order.id, method=order.payment_method)
        db.add(payment)
    payment.method = order.payment_method
    payment.status = PaymentStatus.pendente
    payment.transaction_id = _new_transaction_id()
    payment.mp_preference_id = preference.get("id")
    payment.mp_payment_id = None

    db.commit()
    db.refresh(payment)
    return payment, init_point


def handle_webhook(db: Session, mp_payment_id: str) -> Payment | None:
    """
    Chamado quando o Mercado Pago notifica o webhook (`POST /payments/webhook`).
    Busca o pagamento de verdade na API do Mercado Pago (nunca confia em
    dados que vêm só na querystring do webhook) e atualiza o `Payment` cujo
    `order_id` bate com o `external_reference` devolvido.
    """
    sdk = _sdk()
    response = sdk.payment().get(mp_payment_id)
    if response.get("status") != 200:
        return None

    data = response["response"]
    order_id = data.get("external_reference")
    if not order_id:
        return None

    payment = get_by_order(db, order_id)
    if payment is None:
        return None

    mp_status = data.get("status", "")
    payment.status = _MP_STATUS_MAP.get(mp_status, PaymentStatus.pendente)
    payment.mp_payment_id = str(data.get("id"))
    db.commit()
    db.refresh(payment)
    return payment
