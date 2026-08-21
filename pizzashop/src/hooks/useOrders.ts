import { useCallback, useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "../services/orderService";
import type { Order, OrderStatus } from "../types/order";

const POLL_INTERVAL_MS = 8000;

// Hook usado pela tela admin de gestão de pedidos.
// Faz polling simples para simular pedidos novos chegando em tempo real.
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const changeStatus = useCallback(async (id: string, status: OrderStatus) => {
    const updated = await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  return { orders, loading, error, changeStatus, refetch: fetchOrders };
}
