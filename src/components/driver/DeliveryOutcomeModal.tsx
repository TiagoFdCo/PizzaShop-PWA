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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sheet */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Falha na entrega</p>
              <p className="mt-0.5 text-xs text-gray-400">Pedido de {customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Motivo */}
          <fieldset>
            <legend className="mb-2.5 text-xs font-medium text-gray-500">
              Motivo da falha
            </legend>
            <div className="flex flex-col gap-2">
              {reasons.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all ${
                    reason === value
                      ? "border-primary/50 bg-primary/5 text-gray-900"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="h-4 w-4 shrink-0 accent-primary"
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
              className="mb-2 block text-xs font-medium text-gray-500"
            >
              Observações{" "}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre a ocorrência..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2.5 px-5 pb-5">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-600/40"
          >
            {loading ? "Registrando..." : "Confirmar falha"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
