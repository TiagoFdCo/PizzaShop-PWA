import { Check, X } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, DELIVERY_FAILURE_REASON_LABELS, type OrderStatus, type DeliveryFailure } from "../../types/order";

interface OrderStatusTrackerProps {
  status: OrderStatus;
  deliveryFailure?: DeliveryFailure;
}

export function OrderStatusTracker({ status, deliveryFailure }: OrderStatusTrackerProps) {
  if (status === "falha_entrega") {
    return <DeliveryFailureState deliveryFailure={deliveryFailure} />;
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === ORDER_STATUS_FLOW.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                  done ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-400"
                }`}
              >
                {done ? <Check size={16} /> : index + 1}
              </span>
              {!isLast && <span className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-gray-200"}`} style={{ minHeight: 32 }} />}
            </div>
            <div className="pb-8">
              <p className={`font-medium ${done ? "text-gray-900" : "text-gray-400"}`}>
                {ORDER_STATUS_LABELS[step]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Estado terminal alternativo: falha na entrega (fora do flow linear) */
function DeliveryFailureState({ deliveryFailure }: { deliveryFailure?: DeliveryFailure }) {
  return (
    <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-red-600 text-white">
        <X size={16} />
      </span>
      <div>
        <p className="font-medium text-red-800">Não conseguimos realizar a entrega</p>
        {deliveryFailure && (
          <p className="mt-1 text-sm text-red-700">
            {DELIVERY_FAILURE_REASON_LABELS[deliveryFailure.reason]}
            {deliveryFailure.description ? ` — ${deliveryFailure.description}` : ""}
          </p>
        )}
        <p className="mt-2 text-xs text-red-500">
          Entre em contato com a loja para reagendar ou solicitar reembolso.
        </p>
      </div>
    </div>
  );
}
