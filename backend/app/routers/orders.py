# TODO(P2): implementar as rotas de pedido aqui, usando app/crud/order.py
# (ver TODOs lá) e os schemas em app/schemas/order.py.
#
# Endpoints esperados (ver tabela da seção 4 do plano):
#   POST   /orders                    -> cria pedido (público, sem auth — cliente não loga)
#   GET    /orders                    -> Depends(get_current_staff); admin/cozinha veem tudo,
#                                         entrega só os seus (filtrar por driver_id no crud, não em query aberta)
#   PATCH  /orders/{id}/claim         -> Depends(require_role([StaffRole.cozinha]))
#   PATCH  /orders/{id}/ready         -> Depends(require_role([StaffRole.cozinha]))
#   PATCH  /orders/{id}/dispatch      -> Depends(require_role([StaffRole.cozinha])), body: DispatchInput
#   PATCH  /orders/{id}/delivered     -> Depends(require_role([StaffRole.entrega]))
#   PATCH  /orders/{id}/failed        -> Depends(require_role([StaffRole.entrega])), body: DeliveryFailureInput
#
# Depois de implementar, registrar em app/main.py:
#   from app.routers import orders
#   app.include_router(orders.router)

from fastapi import APIRouter

router = APIRouter(prefix="/orders", tags=["orders"])
