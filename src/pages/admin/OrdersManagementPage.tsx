import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { getOrders, updateOrderStatus } from "../../services/orderService";
import { OrdersTable } from "../../components/admin/OrdersTable";
import { Spinner } from "../../components/ui/Spinner";
import type { Order, OrderStatus } from "../../types/order";

export function OrdersManagementPage() {
  const { data: orders, loading, error } = useFetch(getOrders, []);
  const [localOrders, setLocalOrders] = useState<Order[] | null>(null);

  const list = localOrders ?? orders ?? [];

  async function handleStatusChange(order: Order, status: OrderStatus) {
    const updated = await updateOrderStatus(order.id, status);
    setLocalOrders(list.map((o) => (o.id === updated.id ? updated : o)));
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h1>
      <p className="text-sm text-gray-500">
        Avançar o status aqui atualiza automaticamente a tela de acompanhamento do cliente (via polling).
      </p>

      {loading && <Spinner label="Carregando pedidos..." />}
      {error && <p className="text-red-600 text-sm">Não foi possível carregar os pedidos. {error}</p>}
      {!loading && !error && <OrdersTable orders={list} onStatusChange={handleStatusChange} />}
    </div>
  );
}
