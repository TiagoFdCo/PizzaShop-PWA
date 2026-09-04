import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import {
  DELIVERY_FAILURE_REASON_LABELS,
  type DeliveryFailure,
  type DeliveryFailureReason,
} from "../../types/order";

interface DeliveryOutcomeModalProps {
  orderId: string;
  customerName: string;
  onConfirm: (orderId: string, failure: DeliveryFailure) => Promise<void>;
  onClose: () => void;
}

export function DeliveryOutcomeModal({
  orderId,
  customerName,
  onConfirm,
  onClose,
}: DeliveryOutcomeModalProps) {
  const [reason, setReason] = useState<DeliveryFailureReason>("cliente_ausente");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = Object.entries(DELIVERY_FAILURE_REASON_LABELS) as [
    DeliveryFailureReason,
    string
  ][];

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(orderId, {
        reason,
        description: description.trim() || undefined,
        reportedAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sheet */}
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 rounded-lg p-2">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100 text-sm">Falha na entrega</p>
              <p className="text-xs text-zinc-500 mt-0.5">Pedido de {customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Motivo */}
          <fieldset>
            <legend className="text-xs font-medium text-zinc-400 mb-2.5">
              Motivo da falha
            </legend>
            <div className="flex flex-col gap-2">
              {reasons.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-all ${
                    reason === value
                      ? "border-orange-500/60 bg-orange-500/10 text-zinc-100"
                      : "border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="accent-orange-500 w-4 h-4 shrink-0"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Observações opcionais */}
          <div>
            <label
              htmlFor="description"
              className="text-xs font-medium text-zinc-400 block mb-2"
            >
              Observações{" "}
              <span className="text-zinc-600 font-normal">(opcional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre a ocorrência..."
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-3.5 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex flex-col gap-2.5">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
          >
            {loading ? "Registrando..." : "Confirmar falha"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full text-zinc-500 hover:text-zinc-300 font-medium text-sm py-2.5 rounded-xl transition-colors hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
