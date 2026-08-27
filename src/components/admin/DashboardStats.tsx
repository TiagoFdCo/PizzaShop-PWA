import type { Order } from "../../types/order";
import { formatCurrency } from "../../lib/formatCurrency";

interface DashboardStatsProps {
  orders: Order[];
}

export function DashboardStats({ orders }: DashboardStatsProps) {
  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const revenueToday = ordersToday.reduce((sum, o) => sum + o.total, 0);
  const revenueTotal = orders.reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter((o) => o.status !== "entregue").length;

  const stats = [
    { label: "Pedidos hoje", value: ordersToday.length },
    { label: "Faturamento hoje", value: formatCurrency(revenueToday) },
    { label: "Faturamento total", value: formatCurrency(revenueTotal) },
    { label: "Pedidos em andamento", value: pending },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <p className="text-xs font-medium uppercase text-gray-400">{s.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
