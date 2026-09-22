// Fase 4 (P3) — status e conversão de cupom no painel admin
import { describe, it, expect } from "vitest";
import { couponStatus, describeDiscount } from "../../src/lib/coupon";
import { couponFormSchema, toCouponInput } from "../../src/lib/couponForm";
import type { Coupon } from "../../src/types/loyalty";

const now = new Date("2026-09-22T12:00:00Z");
const base: Coupon = {
  id: "1", code: "PIZZA10", description: "", discountType: "percentual", value: 10, minOrderValue: 0,
  validFrom: "2026-09-01T00:00:00Z", validUntil: null, maxUses: null, usesCount: 0, active: true,
  createdAt: "2026-09-01T00:00:00Z",
};

describe("couponStatus", () => {
  it("ativo quando tudo ok", () => expect(couponStatus(base, now)).toBe("ativo"));
  it("desativado tem prioridade", () =>
    expect(couponStatus({ ...base, active: false, validUntil: "2026-01-01T00:00:00Z" }, now)).toBe("desativado"));
  it("agendado antes do início", () =>
    expect(couponStatus({ ...base, validFrom: "2026-10-01T00:00:00Z" }, now)).toBe("agendado"));
  it("expirado depois do fim", () =>
    expect(couponStatus({ ...base, validUntil: "2026-09-10T00:00:00Z" }, now)).toBe("expirado"));
  it("esgotado ao atingir o limite", () =>
    expect(couponStatus({ ...base, maxUses: 5, usesCount: 5 }, now)).toBe("esgotado"));
});

describe("formulário de cupom", () => {
  const valid = {
    code: "frete15", description: "", discountType: "valor_fixo" as const, value: "15,50",
    minOrderValue: "60", validFrom: "", validUntil: "", maxUses: "",
  };

  it("converte strings do formulário no payload da API", () => {
    const input = toCouponInput(couponFormSchema.parse(valid));
    expect(input).toMatchObject({ code: "FRETE15", value: 15.5, minOrderValue: 60, maxUses: null, validUntil: null });
    expect(describeDiscount(input)).toMatch(/R\$\s*15,50/);
  });

  it("recusa percentual acima de 100", () => {
    const r = couponFormSchema.safeParse({ ...valid, discountType: "percentual", value: "150" });
    expect(r.success).toBe(false);
  });

  it("recusa fim antes do início", () => {
    const r = couponFormSchema.safeParse({ ...valid, validFrom: "2026-10-10T10:00", validUntil: "2026-10-01T10:00" });
    expect(r.success).toBe(false);
  });
});
