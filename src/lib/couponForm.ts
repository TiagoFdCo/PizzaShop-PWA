// Fase 4 (P3) — validação do formulário de cupom (painel admin)
import { z } from "zod";
import { localInputToIso } from "./coupon";
import type { CouponInput } from "../types/loyalty";

const optionalNumber = z
  .string()
  .trim()
  .refine((v) => v === "" || (!Number.isNaN(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) >= 0), {
    message: "Informe um número válido",
  });

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Mínimo de 3 caracteres")
      .max(30, "Máximo de 30 caracteres")
      .regex(/^[A-Za-z0-9_-]+$/, "Use só letras, números, _ ou -"),
    description: z.string().max(200, "Máximo de 200 caracteres"),
    discountType: z.enum(["percentual", "valor_fixo"]),
    value: z
      .string()
      .trim()
      .min(1, "Informe o valor do desconto")
      .refine((v) => Number(v.replace(",", ".")) > 0, "O desconto deve ser maior que zero"),
    minOrderValue: optionalNumber,
    validFrom: z.string(),
    validUntil: z.string(),
    maxUses: z
      .string()
      .trim()
      .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1), "Use um número inteiro a partir de 1"),
  })
  .refine((d) => d.discountType !== "percentual" || Number(d.value.replace(",", ".")) <= 100, {
    path: ["value"],
    message: "Percentual não pode passar de 100%",
  })
  .refine((d) => !d.validFrom || !d.validUntil || new Date(d.validUntil) > new Date(d.validFrom), {
    path: ["validUntil"],
    message: "Deve ser depois do início",
  });

export type CouponFormData = z.infer<typeof couponFormSchema>;

/** Converte o formulário (strings) no payload da API. */
export function toCouponInput(data: CouponFormData): CouponInput {
  const num = (v: string) => Number(v.replace(",", "."));
  return {
    code: data.code.trim().toUpperCase(),
    description: data.description.trim(),
    discountType: data.discountType,
    value: num(data.value),
    minOrderValue: data.minOrderValue ? num(data.minOrderValue) : 0,
    validFrom: localInputToIso(data.validFrom) ?? undefined,
    validUntil: localInputToIso(data.validUntil),
    maxUses: data.maxUses ? Number(data.maxUses) : null,
    active: true,
  };
}
