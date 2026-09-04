import { useParams } from "react-router-dom";
import { useOrderPolling } from "../../hooks/useOrderPolling";
import { OrderStatusTracker } from "../../components/store/OrderStatusTracker";
import { formatCurrency } from "../../lib/formatCurrency";
import { Spinner } from "../../components/ui/Spinner";

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error } = useOrderPolling(id ?? null);

  if (loading && !order) return <Spinner label="Buscando seu pedido..." />;
  if (error && !order) return <p className="p-4 text-red-600">Não foi possível carregar o pedido. {error}</p>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Acompanhe abaixo — esta tela atualiza automaticamente conforme a pizzaria avança seu pedido.
      </p>

      <div className="card mb-6">
        <OrderStatusTracker status={order.status} deliveryFailure={order.deliveryFailure} />
      </div>

      <div className="card space-y-1 text-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Resumo</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-gray-600">
            <span>
              {item.name} ({item.size}) x{item.quantity}
            </span>
            <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t mt-2">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <p className="pt-2 text-gray-500">Entrega em: {order.customer.address}</p>
      </div>
    </div>
  );
}
