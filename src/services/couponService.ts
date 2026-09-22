// Fase 4 (P3) — cupons de desconto
import { apiFetch } from "./api";
import type { Coupon, CouponInput, CouponValidation } from "../types/loyalty";

const ENDPOINT = "/coupons";

/** Público — usado no checkout. Lança ApiError com a mensagem do backend
 * ("Cupom expirado", "Cupom esgotado"...) quando o cupom não vale. */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  return apiFetch<CouponValidation>(`${ENDPOINT}/validate`, {
    method: "POST",
    body: JSON.stringify({ code: code.trim(), subtotal }),
  });
}

// --- Admin (exigem token de admin) ---

export async function getCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>(ENDPOINT);
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  return apiFetch<Coupon>(ENDPOINT, { method: "POST", body: JSON.stringify(input) });
}

export async function updateCoupon(
  id: string,
  changes: Partial<Pick<Coupon, "description" | "validUntil" | "maxUses" | "active">>
): Promise<Coupon> {
  return apiFetch<Coupon>(`${ENDPOINT}/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export async function deleteCoupon(id: string): Promise<void> {
  await apiFetch<void>(`${ENDPOINT}/${id}`, { method: "DELETE" });
}
