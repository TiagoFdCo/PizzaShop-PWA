import type { Order, OrderStatus } from "../../types/order";
import { formatCurrency } from "../../lib/formatCurrency";

const STATUS_FLOW: OrderStatus[] = ["recebido", "preparo", "saiu_entrega", "entregue"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  recebido: "Recebido",
  preparo: "Em preparo",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
};

interface OrdersTableProps {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus) => void;
}

// Tabela de pedidos do painel admin.
// Cada linha mostra o status atual e um botão para avançar ao próximo estágio
// do fluxo (recebido -> preparo -> saiu para entrega -> entregue).
// Essa mudança é o que alimenta a tela de acompanhamento do cliente.
export function OrdersTable({ orders, onStatusChange }: OrdersTableProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum pedido recebido ainda.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b border-gray-200">
          <th className="py-2">Pedido</th>
          <th className="py-2">Cliente</th>
          <th className="py-2">Total</th>
          <th className="py-2">Status</th>
          <th className="py-2">Avançar</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const currentIndex = STATUS_FLOW.indexOf(order.status);
          const nextStatus = STATUS_FLOW[currentIndex + 1];
          return (
            <tr key={order.id} className="border-b border-gray-100">
              <td className="py-2 font-mono">#{order.id.slice(0, 6)}</td>
              <td className="py-2">{order.customer.name}</td>
              <td className="py-2">{formatCurrency(order.total)}</td>
              <td className="py-2">
                <span className="px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs">
                  {STATUS_LABEL[order.status]}
                </span>
              </td>
              <td className="py-2">
                {nextStatus ? (
                  <button
                    onClick={() => onStatusChange(order.id, nextStatus)}
                    className="text-xs px-3 py-1 rounded bg-[var(--color-primary)] text-white"
                  >
                    Marcar como {STATUS_LABEL[nextStatus]}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Concluído</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
