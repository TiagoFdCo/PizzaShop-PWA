// Fase 4 (P3) — contas de fidelidade usadas na prévia do checkout.
// A conta "de verdade" é sempre refeita no backend (app/crud/discount.py);
// isto aqui só evita mostrar ao cliente uma opção que o backend vai recusar.
import type { LoyaltyRules } from "../types/loyalty";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function pointsToReais(points: number, rules: LoyaltyRules): number {
  return round2((points / rules.redeemBlock) * rules.reaisPerBlock);
}

/** Maior quantidade de pontos (múltiplo do bloco) que cabe no saldo e no valor restante. */
export function maxRedeemablePoints(balance: number, remainingSubtotal: number, rules: LoyaltyRules): number {
  if (rules.redeemBlock <= 0 || rules.reaisPerBlock <= 0) return 0;
  const byBalance = Math.floor(balance / rules.redeemBlock);
  const byValue = Math.floor(round2(remainingSubtotal) / rules.reaisPerBlock);
  return Math.max(0, Math.min(byBalance, byValue)) * rules.redeemBlock;
}

/** Pontos que o pedido vai render (valor pago em produtos, sem entrega). */
export function pointsForAmount(amountPaid: number, rules: LoyaltyRules): number {
  return Math.max(0, Math.floor(round2(amountPaid) * rules.pointsPerReal));
}
