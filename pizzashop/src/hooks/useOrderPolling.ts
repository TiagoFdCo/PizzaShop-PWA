import { useEffect, useState } from "react";

interface OrderStatus {
  status: string;
  message?: string;
}

export function useOrderPolling(orderId: string | null) {
  const [orderStatus, setOrderStatus] =
    useState<OrderStatus | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrderStatus(null);
      return;
    }

    let ativo = true;

    const verificarPedido = () => {
      if (!ativo) {
        return;
      }

      setLoading(true);

      setTimeout(() => {
        if (!ativo) {
          return;
        }

        setOrderStatus({
          status: "preparando",
          message: "Seu pedido está sendo preparado.",
        });

        setLoading(false);
      }, 500);
    };

    verificarPedido();

    const intervalo = setInterval(
      verificarPedido,
      5000
    );

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [orderId]);

  return {
    orderStatus,
    loading,
  };
}