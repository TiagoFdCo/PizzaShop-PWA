// Fase 4 (P3) — tabela de cupons (painel admin)
import { Power, Trash2 } from "lucide-react";
import { Badge } from "../../ui/Badge";
import { formatCurrency } from "../../../lib/formatCurrency";
import { COUPON_STATUS_LABELS, couponStatus, describeDiscount, formatDateTime, type CouponStatus } from "../../../lib/coupon";
import type { Coupon } from "../../../types/loyalty";

const STATUS_TONE: Record<CouponStatus, "success" | "neutral" | "danger" | "info" | "warning"> = {
  ativo: "success",
  desativado: "neutral",
  expirado: "danger",
  agendado: "info",
  esgotado: "warning",
};

interface CouponTableProps {
  coupons: Coupon[];
  busyId: string | null;
  onToggle: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export function CouponTable({ coupons, busyId, onToggle, onDelete }: CouponTableProps) {
  if (coupons.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nenhum cupom cadastrado ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Desconto</th>
            <th className="px-4 py-3">Pedido mínimo</th>
            <th className="px-4 py-3">Validade</th>
            <th className="px-4 py-3">Usos</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {coupons.map((c) => {
            const status = couponStatus(c);
            const busy = busyId === c.id;
            return (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-gray-900">{c.code}</span>
                  {c.description && <span className="block text-xs text-gray-500">{c.description}</span>}
                </td>
                <td className="px-4 py-3 text-gray-700">{describeDiscount(c)}</td>
                <td className="px-4 py-3 text-gray-600">{c.minOrderValue > 0 ? formatCurrency(c.minOrderValue) : "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  de {formatDateTime(c.validFrom)}
                  <br />
                  {c.validUntil ? `até ${formatDateTime(c.validUntil)}` : "sem data final"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.usesCount}
                  {c.maxUses !== null && ` / ${c.maxUses}`}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[status]}>{COUPON_STATUS_LABELS[status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onToggle(c)}
                      disabled={busy}
                      aria-label={c.active ? `Desativar ${c.code}` : `Ativar ${c.code}`}
                      title={c.active ? "Desativar" : "Ativar"}
                      className={`rounded p-1.5 hover:bg-gray-100 disabled:opacity-40 ${
                        c.active ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(c)}
                      disabled={busy}
                      aria-label={`Excluir ${c.code}`}
                      title="Excluir"
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
