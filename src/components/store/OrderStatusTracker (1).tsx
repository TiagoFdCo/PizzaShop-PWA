import { Check } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from "../../types/order";

interface OrderStatusTrackerProps {
  status: OrderStatus;
}

export function OrderStatusTracker({ status }: OrderStatusTrackerProps) {
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
