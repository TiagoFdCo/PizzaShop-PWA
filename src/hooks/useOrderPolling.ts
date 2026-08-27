import { useEffect, useState } from "react";
import { getOrderById } from "../services/orderService";
import type { Order } from "../types/order";

interface UseOrderPollingResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
}

// Faz polling do pedido a cada `intervalMs`, refletindo na tela do cliente
// qualquer mudança de status feita pelo admin (fonte única de verdade: a API).
export function useOrderPolling(orderId: string | null, intervalMs = 4000): UseOrderPollingResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchStatus() {
      try {
        const data = await getOrderById(orderId!);
        if (active) {
          setOrder(data);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError((e as Error).message);
          setLoading(false);
        }
      }
    }

    fetchStatus();
    const timer = setInterval(fetchStatus, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId, intervalMs]);

  return { order, loading, error };
}
