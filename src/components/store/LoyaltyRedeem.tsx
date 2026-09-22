// Fase 4 (P3) — saldo e resgate de pontos no checkout (só aparece com cliente logado)
import { Minus, Plus, Star } from "lucide-react";
import { formatCurrency } from "../../lib/formatCurrency";
import { maxRedeemablePoints, pointsToReais } from "../../lib/loyalty";
import type { LoyaltyAccount } from "../../types/loyalty";

interface LoyaltyRedeemProps {
  account: LoyaltyAccount;
  /** Valor dos produtos que ainda sobra depois do cupom */
  remainingSubtotal: number;
  redeemPoints: number;
  onChange: (points: number) => void;
}

export function LoyaltyRedeem({ account, remainingSubtotal, redeemPoints, onChange }: LoyaltyRedeemProps) {
  const { rules, pointsBalance } = account;
  const max = maxRedeemablePoints(pointsBalance, remainingSubtotal, rules);
  const missing = rules.redeemBlock - pointsBalance;

  return (
    <div className="rounded-lg border border-gray-200 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium text-gray-800">
        <Star size={16} className="text-primary" aria-hidden />
        Você tem {pointsBalance} {pointsBalance === 1 ? "ponto" : "pontos"}
      </p>

      {pointsBalance < rules.redeemBlock ? (
        <p className="mt-1 text-xs text-gray-500">
          Faltam {missing} pontos para seu primeiro resgate ({rules.redeemBlock} pontos ={" "}
          {formatCurrency(rules.reaisPerBlock)}).
        </p>
      ) : max === 0 ? (
        <p className="mt-1 text-xs text-gray-500">O valor deste pedido é baixo demais para usar pontos.</p>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-gray-600">
            Usar {redeemPoints} pontos
            {redeemPoints > 0 && <> (−{formatCurrency(pointsToReais(redeemPoints, rules))})</>}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, redeemPoints - rules.redeemBlock))}
              disabled={redeemPoints === 0}
              aria-label="Usar menos pontos"
              className="rounded-full border p-1 hover:bg-gray-50 disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.min(max, redeemPoints + rules.redeemBlock))}
              disabled={redeemPoints >= max}
              aria-label="Usar mais pontos"
              className="rounded-full border p-1 hover:bg-gray-50 disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
