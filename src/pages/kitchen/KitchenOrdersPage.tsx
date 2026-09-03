import { AlertCircle, CheckCircle2, ChefHat, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KitchenOrderCard } from "../../components/kitchen/KitchenOrderCard";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { getKitchenOrders, getDrivers, claimOrderForCooking, markOrderReady, dispatchOrder, MOCK_COOK } from "../../services/kitchenService";
import type { Order } from "../../types/order";
import type { Staff } from "../../types/staff";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function KitchenOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [orderList, driverList] = await Promise.all([getKitchenOrders(), getDrivers()]);
      setOrders(orderList);
      setDrivers(driverList);
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os pedidos." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const kitchenOrders = useMemo(
    () => orders.filter((order) => ["recebido", "preparo", "pronto_entrega"].includes(order.status)),
    [orders]
  );

  async function runAction(action: string, successMessage: string, operation: () => Promise<Order>) {
    setBusyAction(action);
    setFeedback(null);
    try {
      const updated = await operation();
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setFeedback({ type: "success", message: successMessage });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Não foi possível concluir a ação." });
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) return <div className="p-6"><Spinner label="Carregando pedidos da cozinha..." /></div>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${
            feedback.type === "success" ? "border-green-200" : "border-red-200"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="text-green-600" size={20} /> : <AlertCircle className="text-red-600" size={20} />}
          <p className="text-sm font-medium text-gray-800">{feedback.message}</p>
        </div>
      )}

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="text-primary" size={25} />
            <h1 className="text-2xl font-bold text-gray-900">Pedidos da cozinha</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Gerencie os pedidos recebidos até o despacho para entrega.</p>
        </div>
        <Button variant="secondary" onClick={() => void load(true)} disabled={refreshing} className="gap-2">
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> Atualizar
        </Button>
      </header>

      {kitchenOrders.length === 0 ? (
        <div className="card py-14 text-center">
          <ChefHat className="mx-auto mb-3 text-gray-300" size={40} />
          <h2 className="font-semibold text-gray-800">Nenhum pedido aguardando na cozinha</h2>
          <p className="mt-1 text-sm text-gray-500">Quando um novo pedido for recebido, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {kitchenOrders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              drivers={drivers}
              busyAction={busyAction}
              onClaim={(item) => void runAction(`claim:${item.id}`, `Pedido #${item.id} assumido para preparo.`, () => claimOrderForCooking(item.id, MOCK_COOK))}
              onReady={(item) => void runAction(`ready:${item.id}`, `Pedido #${item.id} marcado como pronto.`, () => markOrderReady(item.id))}
              onDispatch={(item, driver) => void runAction(`dispatch:${item.id}`, `Pedido #${item.id} enviado com ${driver.name}.`, () => dispatchOrder(item.id, driver))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
