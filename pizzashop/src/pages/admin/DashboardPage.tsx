import { useEffect, useState } from "react";
import { getOrders } from "../../services/orderService";
import { DashboardStats } from "../../components/admin/DashboardStats";
import { Spinner } from "../../components/ui/Spinner";
import type { Order } from "../../types/order";

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function isSameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

// Dashboard simples: busca todos os pedidos e agrega no cliente
// (número de pedidos e faturamento do dia/mês). Em uma versão futura,
// essa agregação pode migrar para o backend/endpoint dedicado.
export function DashboardPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  if (!orders) return <Spinner />;

  const now = new Date();
  const today = orders.filter((o) => isSameDay(new Date(o.createdAt), now));
  const month = orders.filter((o) => isSameMonth(new Date(o.createdAt), now));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <DashboardStats
        ordersToday={today.length}
        revenueToday={today.reduce((sum, o) => sum + o.total, 0)}
        ordersMonth={month.length}
        revenueMonth={month.reduce((sum, o) => sum + o.total, 0)}
      />
    </div>
  );
}
