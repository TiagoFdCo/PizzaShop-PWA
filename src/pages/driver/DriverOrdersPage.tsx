import { useEffect, useState, useCallback } from "react";
import { RefreshCw, PackageCheck, WifiOff } from "lucide-react";
import type { DeliveryFailure, Order } from "../../types/order";
import {
  getOrdersForDriver,
  markOrderDelivered,
  markOrderFailed,
} from "../../services/orderService";
import { useAuthStore } from "../../store/useAuthStore";
import { DriverLayout } from "../../components/layout/DriverLayout";
import { DriverOrderCard } from "../../components/driver/DriverOrderCard";

type Toast = { id: number; message: string; type: "success" | "error" };

export function DriverOrdersPage() {
  const session = useAuthStore((s) => s.session);
  // O driverId vem da sessão real — DriverGate garante que session.id existe
  const driverId = session!.id!;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, type: Toast["type"]) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrdersForDriver(driverId);
      setOrders(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleDelivered(orderId: string) {
    try {
      await markOrderDelivered(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      addToast("Entrega confirmada!", "success");
    } catch {
      addToast("Erro ao confirmar entrega. Tente novamente.", "error");
    }
  }

  async function handleFailed(orderId: string, failure: DeliveryFailure) {
    try {
      await markOrderFailed(orderId, failure);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      addToast("Falha registrada.", "success");
    } catch {
      addToast("Erro ao registrar falha. Tente novamente.", "error");
    }
  }

  return (
    <DriverLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-zinc-100">Suas entregas</h1>
          {!loading && !error && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {orders.length === 0
                ? "Nenhum pedido pendente"
                : `${orders.length} pedido${orders.length > 1 ? "s" : ""} em rota`}
            </p>
          )}
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm py-1.5 px-3 rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Carregando pedidos...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="bg-zinc-800 rounded-full p-4">
            <WifiOff size={24} className="text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Erro ao carregar pedidos</p>
            <p className="text-xs text-zinc-600 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchOrders}
            className="text-sm text-orange-400 hover:text-orange-300 border border-orange-500/30 px-4 py-2 rounded-lg hover:bg-orange-500/5 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="bg-zinc-800 rounded-full p-5">
            <PackageCheck size={28} className="text-zinc-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-300 text-sm">Tudo entregue!</p>
            <p className="text-xs text-zinc-600 mt-1">
              Nenhum pedido aguardando entrega no momento.
            </p>
          </div>
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <DriverOrderCard
              key={order.id}
              order={order}
              onDelivered={handleDelivered}
              onFailed={handleFailed}
            />
          ))}
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full text-sm font-medium px-4 py-3 rounded-xl shadow-xl border transition-all text-center ${
              toast.type === "success"
                ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                : "bg-red-950 border-red-700 text-red-300"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </DriverLayout>
  );
}
