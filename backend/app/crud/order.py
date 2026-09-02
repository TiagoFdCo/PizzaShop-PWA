# TODO(P2): implementar a lógica de negócio dos pedidos aqui.
#
# Os models (Order, OrderItem, OrderItemTopping, DeliveryFailure) e schemas
# (OrderInput, OrderOut, DispatchInput, DeliveryFailureInput) já estão
# prontos em app/models/order.py e app/schemas/order.py.
#
# Funções esperadas por app/routers/orders.py (ver TODOs lá):
#   - create_order(db, tenant_id, data: OrderInput) -> Order
#   - list_orders(db, tenant_id, staff: Staff) -> list[Order]
#       admin/cozinha veem tudo; entregador só os pedidos onde driver_id == staff.id
#   - claim_order(db, order_id, cook: Staff) -> Order        # status -> preparo
#   - mark_ready(db, order_id) -> Order                       # status -> pronto_entrega
#   - dispatch_order(db, order_id, driver_id: str) -> Order   # status -> saiu_para_entrega
#   - mark_delivered(db, order_id) -> Order                   # status -> entregue
#   - mark_failed(db, order_id, data: DeliveryFailureInput) -> Order  # status -> falha_entrega
#
# Lembrete do schemas/order.py: converter Order (ORM) -> OrderOut precisa
# montar `customer` e `cook`/`driver` manualmente — ver o docstring de
# OrderOut em app/schemas/order.py.
