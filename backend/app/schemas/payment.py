from datetime import datetime

from app.models.order import PaymentMethod
from app.models.payment import PaymentStatus
from app.schemas.common import CamelModel


class PaymentOut(CamelModel):
    id: str
    order_id: str
    method: PaymentMethod
    status: PaymentStatus
    transaction_id: str
    created_at: datetime
    updated_at: datetime
    # Presente só logo após criar/reiniciar o pagamento via Mercado Pago —
    # URL do Checkout Pro pro front redirecionar o navegador. None quando
    # não há redirecionamento (dinheiro, ou pagamento já aprovado).
    init_point: str | None = None
