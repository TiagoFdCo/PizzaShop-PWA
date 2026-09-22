// Fase 4 (P3) — campo de cupom do checkout
import { useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { validateCoupon } from "../../services/couponService";
import { formatCurrency } from "../../lib/formatCurrency";
import type { CouponValidation } from "../../types/loyalty";

interface CouponFieldProps {
  subtotal: number;
  applied: CouponValidation | null;
  onApply: (coupon: CouponValidation) => void;
  onRemove: () => void;
}

export function CouponField({ subtotal, applied, onApply, onRemove }: CouponFieldProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!code.trim()) {
      setError("Digite o código do cupom");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await validateCoupon(code, subtotal);
      onApply(result);
      setCode("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 text-green-800">
          <TicketPercent size={16} aria-hidden />
          <span>
            <strong>{applied.code}</strong> aplicado — {formatCurrency(applied.discount)} de desconto
            {applied.description && <span className="block text-xs text-green-700">{applied.description}</span>}
          </span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover cupom ${applied.code}`}
          className="text-green-700 hover:text-red-600"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="coupon-code" className="mb-1 block text-sm font-medium text-gray-700">
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          className="input flex-1 uppercase"
          placeholder="Ex.: PIZZA10"
          value={code}
          maxLength={30}
          autoComplete="off"
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            // Enter aplica o cupom em vez de enviar o formulário de checkout
            if (e.key === "Enter") {
              e.preventDefault();
              void handleApply();
            }
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
        />
        <button type="button" onClick={handleApply} disabled={loading}
          className="rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {loading ? "Validando..." : "Aplicar"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
