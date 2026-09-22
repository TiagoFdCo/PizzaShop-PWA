import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.crud.payment import PaymentConfigError, create_or_retry_payment, get_by_order, handle_webhook
from app.db.session import get_db
from app.schemas.payment import PaymentOut

logger = logging.getLogger(__name__)

router = APIRouter(tags=["payments"])


def _to_out(payment, init_point: str | None = None) -> PaymentOut:
    return PaymentOut.model_validate(payment).model_copy(update={"init_point": init_point})


@router.post(
    "/orders/{order_id}/payment",
    response_model=PaymentOut,
    summary="Cria (ou reinicia, em retry) o pagamento de um pedido via Mercado Pago — sem autenticação, igual /track",
)
def pay_order(order_id: str, db: Session = Depends(get_db)) -> PaymentOut:
    try:
        payment, init_point = create_or_retry_payment(db, order_id)
    except PaymentConfigError as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)) from error
    except ValueError as error:
        message = str(error)
        code = status.HTTP_404_NOT_FOUND if "não encontrado" in message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=message) from error

    return _to_out(payment, init_point)


@router.get(
    "/orders/{order_id}/payment",
    response_model=PaymentOut,
    summary="Consulta o pagamento de um pedido — sem autenticação, igual /track",
)
def read_payment(order_id: str, db: Session = Depends(get_db)) -> PaymentOut:
    payment = get_by_order(db, order_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pagamento não encontrado.")

    return _to_out(payment)


@router.post(
    "/payments/webhook",
    include_in_schema=False,
    summary="Webhook do Mercado Pago — chamado por eles, nunca pelo front",
)
async def mercado_pago_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    """
    O Mercado Pago manda o aviso de duas formas (dependendo de como a
    notificação foi configurada): como querystring (`?type=payment&data.id=123`,
    ou o formato IPN legado `?topic=payment&id=123`) ou como corpo JSON. Lemos
    as duas pra não perder notificação por causa do formato.

    Sempre respondemos 200 (mesmo se não for um evento de pagamento, ou se o
    id não bater com nada aqui) — se devolvermos erro, o Mercado Pago
    reagenda e insiste, e eventualmente desativa o webhook depois de muitas
    falhas seguidas.
    """
    params = request.query_params
    payment_id = params.get("data.id") or params.get("id")
    topic = params.get("type") or params.get("topic")

    if payment_id is None:
        try:
            body = await request.json()
        except Exception:
            body = {}
        payment_id = (body.get("data") or {}).get("id")
        topic = topic or body.get("type")

    if topic == "payment" and payment_id:
        try:
            handle_webhook(db, str(payment_id))
        except PaymentConfigError:
            logger.warning("Webhook do Mercado Pago recebido, mas MP_ACCESS_TOKEN não está configurado.")
        except Exception:
            logger.exception("Falha ao processar webhook do Mercado Pago (payment_id=%s)", payment_id)

    return {"received": True}
