// Fase 4 (P3) — regras de exibição de cupom no painel admin
import type { Coupon } from "../types/loyalty";
import { formatCurrency } from "./formatCurrency";

export type CouponStatus = "ativo" | "desativado" | "expirado" | "agendado" | "esgotado";

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  ativo: "Ativo",
  desativado: "Desativado",
  expirado: "Expirado",
  agendado: "Agendado",
  esgotado: "Esgotado",
};

/** Mesma ordem de checagem do backend (app/crud/coupon.py::check_coupon). */
export function couponStatus(coupon: Coupon, now: Date = new Date()): CouponStatus {
  if (!coupon.active) return "desativado";
  if (new Date(coupon.validFrom) > now) return "agendado";
  if (coupon.validUntil && new Date(coupon.validUntil) < now) return "expirado";
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) return "esgotado";
  return "ativo";
}

export function describeDiscount(coupon: Pick<Coupon, "discountType" | "value">): string {
  return coupon.discountType === "percentual"
    ? `${coupon.value.toLocaleString("pt-BR")}%`
    : formatCurrency(coupon.value);
}

/** "2026-09-22T10:00" (input datetime-local, hora local) -> ISO com fuso. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
