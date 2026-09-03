import type { Order, OrderStatus } from "../../types/order";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "../../types/order";
import { formatCurrency } from "../../lib/formatCurrency";
import { Badge } from "../ui/Badge";

interface OrdersTableProps {
  orders: Order[];
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

const STATUS_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger"> = {
  recebido: "neutral",
  preparo: "warning",
  pronto_entrega: "warning",       // novo status P2
  saiu_para_entrega: "warning",
  entregue: "success",
  falha_entrega: "danger",         // novo status P3
};

export function OrdersTable({ orders, onStatusChange }: OrdersTableProps) {
  if (orders.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nenhum pedido recebido ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Avançar status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.id}</td>
              <td className="px-4 py-3 text-gray-800">{order.customer.name}</td>
              <td className="px-4 py-3 text-gray-600">{formatCurrency(order.total)}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order, e.target.value as OrderStatus)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label={`Status do pedido ${order.id}`}
                >
                  {ORDER_STATUS_FLOW.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
