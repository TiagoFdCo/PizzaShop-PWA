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
      <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">#{order.id}</span>
            <span className="h-3 w-px bg-zinc-700" />
            <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-full font-medium">
              Em rota
            </span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500 text-xs">
            <Clock size={12} />
            <span>{formatTime(order.createdAt)}</span>
          </div>
        </div>

        {/* Client info */}
        <div className="px-4 pt-4 pb-3">
          <p className="font-semibold text-zinc-100 text-base">{order.customer.name}</p>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.customer.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 mt-2 group"
          >
            <MapPin size={14} className="text-zinc-500 mt-0.5 shrink-0 group-hover:text-orange-400 transition-colors" />
            <span className="text-sm text-zinc-400 group-hover:text-orange-400 transition-colors leading-snug">
              {order.customer.address}
            </span>
          </a>

          <a
            href={`tel:${order.customer.phone}`}
            className="flex items-center gap-2 mt-1.5 group"
          >
            <Phone size={13} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
            <span className="text-sm text-zinc-400 group-hover:text-orange-400 transition-colors">
              {order.customer.phone}
            </span>
          </a>
        </div>

        {/* Items toggle */}
        <button
          onClick={() => setShowItems((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
        >
          <span className="text-xs text-zinc-500">
            {order.items.length} {order.items.length === 1 ? "item" : "itens"} ·{" "}
            {paymentLabel[order.paymentMethod]}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">
              {formatCurrency(order.total)}
            </span>
            {showItems ? (
              <ChevronUp size={14} className="text-zinc-500" />
            ) : (
              <ChevronDown size={14} className="text-zinc-500" />
            )}
          </div>
        </button>

        {showItems && (
          <ul className="px-4 pb-3 border-t border-zinc-800/40 pt-2.5 flex flex-col gap-1.5">
            {order.items.map((item) => (
              // usa cartItemId (campo correto do CartItem real do projeto)
              <li key={item.cartItemId} className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  {item.quantity}× {item.name}{" "}
                  <span className="text-zinc-600 text-xs">
                    ({SIZE_LABEL[item.size] ?? item.size})
                  </span>
                </span>
                <span className="text-zinc-500 text-xs">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
            <li className="flex justify-between text-xs text-zinc-600 pt-1 border-t border-zinc-800 mt-1">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </li>
          </ul>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 pt-3 flex flex-col gap-2.5 border-t border-zinc-800/60">
          <button
            onClick={handleDelivered}
            disabled={loadingDelivered}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
          >
            <CheckCircle2 size={16} />
            {loadingDelivered ? "Confirmando..." : "Marcar como entregue"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            disabled={loadingDelivered}
            className="w-full flex items-center justify-center gap-2 border border-zinc-700 hover:border-red-500/50 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 font-medium text-sm py-3 rounded-xl transition-all"
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
