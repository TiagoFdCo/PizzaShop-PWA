// Fase 4 (P3) — tela de cupons do admin
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouponsManagementPage } from "../../src/pages/admin/CouponsManagementPage";
import * as couponService from "../../src/services/couponService";
import type { Coupon } from "../../src/types/loyalty";

const coupon: Coupon = {
  id: "1", code: "PIZZA10", description: "10% off", discountType: "percentual", value: 10, minOrderValue: 0,
  validFrom: "2026-01-01T00:00:00Z", validUntil: null, maxUses: null, usesCount: 3, active: true,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("CouponsManagementPage", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("lista os cupons vindos da API", async () => {
    vi.spyOn(couponService, "getCoupons").mockResolvedValue([coupon]);
    render(<CouponsManagementPage />);
    expect(await screen.findByText("PIZZA10")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("cria um cupom pelo formulário", async () => {
    vi.spyOn(couponService, "getCoupons").mockResolvedValue([]);
    const create = vi.spyOn(couponService, "createCoupon").mockResolvedValue({ ...coupon, code: "NOVO5", id: "2" });
    render(<CouponsManagementPage />);

    await userEvent.click(await screen.findByRole("button", { name: /Novo cupom/ }));
    await userEvent.type(screen.getByLabelText("Código"), "novo5");
    await userEvent.type(screen.getByLabelText("Desconto (%)"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Criar cupom" }));

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ code: "NOVO5", value: 5, discountType: "percentual" }));
    expect(await screen.findByText("NOVO5")).toBeInTheDocument();
  });

  it("desativa um cupom", async () => {
    vi.spyOn(couponService, "getCoupons").mockResolvedValue([coupon]);
    const update = vi.spyOn(couponService, "updateCoupon").mockResolvedValue({ ...coupon, active: false });
    render(<CouponsManagementPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Desativar PIZZA10" }));
    expect(update).toHaveBeenCalledWith("1", { active: false });
    expect(await screen.findByText("Desativado")).toBeInTheDocument();
  });
});
