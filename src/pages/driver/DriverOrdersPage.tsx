import { useEffect, useState, useCallback } from "react";
import { RefreshCw, PackageCheck, WifiOff, Star } from "lucide-react";
import type { DeliveryFailure, Order } from "../../types/order";
import {
  getOrdersForDriver,
  getDeliveredOrdersForDriver,
  markOrderDelivered,
  markOrderFailed,
} from "../../services/orderService";
import { useAuthStore } from "../../store/useAuthStore";
import { DriverLayout } from "../../components/layout/DriverLayout";
import { DriverOrderCard } from "../../components/driver/DriverOrderCard";

type Toast = { id: number; message: string; type: "success" | "error" };
type Tab = "rota" | "entregues";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Estrelas somente-leitura — mostra a nota que o cliente deu pra entrega. */
function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-xs text-gray-400">Cliente ainda não avaliou</span>;
  }
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export function DriverOrdersPage() {
  const session = useAuthStore((s) => s.session);
  // O driverId vem da sessão real — DriverGate garante que session.id existe
  const driverId = session!.staff.id;

  const [tab, setTab] = useState<Tab>("rota");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [delivered, setDelivered] = useState<Order[]>([]);
  const [deliveredLoading, setDeliveredLoading] = useState(true);
  const [deliveredError, setDeliveredError] = useState<string | null>(null);

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

  const fetchDelivered = useCallback(async () => {
    setDeliveredLoading(true);
    setDeliveredError(null);
    try {
      const data = await getDeliveredOrdersForDriver(driverId);
      setDelivered(data);
    } catch (e) {
      setDeliveredError((e as Error).message);
    } finally {
      setDeliveredLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchOrders();
    fetchDelivered();
  }, [fetchOrders, fetchDelivered]);

  async function handleDelivered(orderId: string) {
    try {
      await markOrderDelivered(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      addToast("Entrega confirmada!", "success");
      void fetchDelivered(); // atualiza o histórico com a entrega que acabou de sair de "em rota"
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

  const ratedCount = delivered.filter((o) => o.rating !== null).length;
  const averageRating =
    ratedCount > 0
      ? delivered.reduce((sum, o) => sum + (o.rating ?? 0), 0) / ratedCount
      : null;

  return (
    <DriverLayout>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Suas entregas</h1>
          {tab === "rota" && !loading && !error && (
            <p className="mt-0.5 text-xs text-gray-400">
              {orders.length === 0
                ? "Nenhum pedido pendente"
                : `${orders.length} pedido${orders.length > 1 ? "s" : ""} em rota`}
            </p>
          )}
          {tab === "entregues" && !deliveredLoading && !deliveredError && (
            <p className="mt-0.5 text-xs text-gray-400">
              {averageRating !== null
                ? `Nota média: ${averageRating.toFixed(1)} ★ (${ratedCount} avaliação${ratedCount > 1 ? "ões" : ""})`
                : "Nenhuma avaliação recebida ainda"}
            </p>
          )}
        </div>
        <button
          onClick={() => (tab === "rota" ? fetchOrders() : fetchDelivered())}
          disabled={tab === "rota" ? loading : deliveredLoading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
        >
          <RefreshCw size={14} className={(tab === "rota" ? loading : deliveredLoading) ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Abas: em rota x avaliação das entregas concluídas */}
      <div className="mb-5 flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab("rota")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "rota" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Em rota
        </button>
        <button
          onClick={() => setTab("entregues")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "entregues" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Entregues
        </button>
      </div>

      {tab === "rota" && (
        <>
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-gray-400">Carregando pedidos...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <WifiOff size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Erro ao carregar pedidos</p>
                <p className="mt-1 text-xs text-gray-400">{error}</p>
              </div>
              <button
                onClick={fetchOrders}
                className="rounded-lg border border-primary/30 px-4 py-2 text-sm text-primary transition-all hover:bg-primary/5"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-gray-100 p-5">
                <PackageCheck size={28} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Tudo entregue!</p>
                <p className="mt-1 text-xs text-gray-400">
                  Nenhum pedido aguardando entrega no momento.
                </p>
              </div>
            </div>
          )}

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
        </>
      )}

      {tab === "entregues" && (
        <>
          {deliveredLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-gray-400">Carregando histórico...</p>
            </div>
          )}

          {!deliveredLoading && deliveredError && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-sm text-gray-400">{deliveredError}</p>
            </div>
          )}

          {!deliveredLoading && !deliveredError && delivered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-full bg-gray-100 p-5">
                <Star size={28} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Nenhuma entrega concluída ainda</p>
                <p className="mt-1 text-xs text-gray-400">
                  As entregas que você concluir aparecem aqui, com a nota do cliente.
                </p>
              </div>
            </div>
          )}

          {!deliveredLoading && !deliveredError && delivered.length > 0 && (
            <div className="flex flex-col gap-3">
              {delivered.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customer.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <RatingStars rating={order.rating} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-medium shadow-xl transition-all ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </DriverLayout>
  );
}
