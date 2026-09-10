import { useState } from "react";
import { useParams } from "react-router-dom";
import { useOrderPolling } from "../../hooks/useOrderPolling";
import { OrderStatusTracker } from "../../components/store/OrderStatusTracker";
import { formatCurrency } from "../../lib/formatCurrency";
import { Spinner } from "../../components/ui/Spinner";
import { rateOrder } from "../../services/orderService";

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error } = useOrderPolling(id ?? null);

  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  if (loading && !order) return <Spinner label="Buscando seu pedido..." />;
  if (error && !order) return <p className="p-4 text-red-600">Não foi possível carregar o pedido. {error}</p>;
  if (!order) return null;

  const currentRating = localRating ?? order.rating;

  async function handleRate(stars: number) {
    if (!id || submittingRating || currentRating !== null) return;
    setSubmittingRating(true);
    setRatingError(null);
    try {
      await rateOrder(id, stars);
      setLocalRating(stars);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Não foi possível enviar sua avaliação.");
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Acompanhe abaixo — esta tela atualiza automaticamente conforme a pizzaria avança seu pedido.
      </p>

      <div className="card mb-6">
        <OrderStatusTracker status={order.status} deliveryFailure={order.deliveryFailure} />
      </div>

      {order.status === "entregue" && (
        <div className="card mb-6 text-center">
          {currentRating !== null ? (
            <p className="text-sm text-gray-600">
              Obrigado pela avaliação! Você deu {currentRating} {currentRating === 1 ? "estrela" : "estrelas"}.
            </p>
          ) : (
            <>
              <h2 className="font-semibold text-gray-800 mb-2">Como foi seu pedido?</h2>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={submittingRating}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(null)}
                    aria-label={`Avaliar com ${star} ${star === 1 ? "estrela" : "estrelas"}`}
                    className="text-3xl leading-none transition disabled:opacity-50"
                  >
                    <span className={(hoverStar ?? 0) >= star ? "text-yellow-400" : "text-gray-300"}>★</span>
                  </button>
                ))}
              </div>
              {ratingError && <p className="mt-2 text-xs text-red-500">{ratingError}</p>}
            </>
          )}
        </div>
      )}

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