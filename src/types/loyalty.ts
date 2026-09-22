// Fase 4 (P3) — tipos de cupom e fidelidade (espelham app/schemas/coupon.py e loyalty.py)

export type CouponDiscountType = "percentual" | "valor_fixo";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  value: number;
  minOrderValue: number;
  validFrom: string;
  validUntil: string | null;
  maxUses: number | null;
  usesCount: number;
  active: boolean;
  createdAt: string;
}

export type CouponInput = Pick<Coupon, "code" | "discountType" | "value"> &
  Partial<Pick<Coupon, "description" | "minOrderValue" | "validFrom" | "validUntil" | "maxUses" | "active">>;

/** Resposta de POST /coupons/validate */
export interface CouponValidation {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  value: number;
  discount: number;
}

export interface LoyaltyRules {
  pointsPerReal: number;
  redeemBlock: number;
  reaisPerBlock: number;
}

export type LoyaltyTransactionType = "ganho" | "resgate" | "estorno";

export interface LoyaltyTransaction {
  id: string;
  orderId: string | null;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  createdAt: string;
}

export interface LoyaltyAccount {
  pointsBalance: number;
  lifetimePoints: number;
  rules: LoyaltyRules;
  transactions: LoyaltyTransaction[];
}
