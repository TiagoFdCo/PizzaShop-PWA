import { useState } from "react";
import { MapPin, Phone, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { DeliveryFailure, Order } from "../../types/order";
import { DeliveryOutcomeModal } from "./DeliveryOutcomeModal";

interface DriverOrderCardProps {
  order: Order;
  onDelivered: (orderId: string) => Promise<void>;
  onFailed: (orderId: string, failure: DeliveryFailure) => Promise<void>;
}

function formatTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min atrás`;
  return `${Math.floor(diff / 60)}h atrás`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const SIZE_LABEL: Record<string, string> = { P: "Pequena", M: "Média", G: "Grande" };

export function DriverOrderCard({ order, onDelivered, onFailed }: DriverOrderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [loadingDelivered, setLoadingDelivered] = useState(false);
  const [showItems, setShowItems] = useState(false);

  async function handleDelivered() {
    setLoadingDelivered(true);
    try {
      await onDelivered(order.id);
    } finally {
      setLoadingDelivered(false);
    }
  }

  const paymentLabel: Record<Order["paymentMethod"], string> = {
    pix: "PIX",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
  };

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400">#{order.id}</span>
            <span className="h-3 w-px bg-gray-200" />
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Em rota
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            <span>{formatTime(order.createdAt)}</span>
          </div>
        </div>

        {/* Client info */}
        <div className="px-4 pb-3 pt-4">
          <p className="text-base font-semibold text-gray-900">{order.customer.name}</p>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.customer.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 flex items-start gap-2"
          >
            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-primary" />
            <span className="text-sm leading-snug text-gray-600 transition-colors group-hover:text-primary">
              {order.customer.address}
            </span>
          </a>

          <a
            href={`tel:${order.customer.phone}`}
            className="group mt-1.5 flex items-center gap-2"
          >
            <Phone size={13} className="text-gray-400 transition-colors group-hover:text-primary" />
            <span className="text-sm text-gray-600 transition-colors group-hover:text-primary">
              {order.customer.phone}
            </span>
          </a>
        </div>

        {/* Items toggle */}
        <button
          onClick={() => setShowItems((v) => !v)}
          className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
        >
          <span className="text-xs text-gray-400">
            {order.items.length} {order.items.length === 1 ? "item" : "itens"} ·{" "}
            {paymentLabel[order.paymentMethod]}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">
              {formatCurrency(order.total)}
            </span>
            {showItems ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </button>

        {showItems && (
          <ul className="flex flex-col gap-1.5 border-t border-gray-100 px-4 pb-3 pt-2.5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}× {item.name}{" "}
                  <span className="text-xs text-gray-400">
                    ({SIZE_LABEL[item.size] ?? item.size})
                  </span>
                </span>
                <span className="text-xs text-gray-400">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
            <li className="mt-1 flex justify-between border-t border-gray-100 pt-1 text-xs text-gray-400">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </li>
          </ul>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 border-t border-gray-100 px-4 pb-4 pt-3">
          <button
            onClick={handleDelivered}
            disabled={loadingDelivered}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-600/40"
          >
            <CheckCircle2 size={16} />
            {loadingDelivered ? "Confirmando..." : "Marcar como entregue"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            disabled={loadingDelivered}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <XCircle size={15} />
            Não consegui entregar
          </button>
        </div>
      </article>

      {showModal && (
        <DeliveryOutcomeModal
          orderId={order.id}
          customerName={order.customer.name}
          onConfirm={onFailed}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
