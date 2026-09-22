// Fase 4 (P3) — campo de cupom do checkout
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouponField } from "../../src/components/store/CouponField";
import * as couponService from "../../src/services/couponService";

describe("CouponField", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("valida o código e avisa o checkout quando o cupom vale", async () => {
    const valid = { code: "PIZZA10", description: "", discountType: "percentual" as const, value: 10, discount: 8 };
    const spy = vi.spyOn(couponService, "validateCoupon").mockResolvedValue(valid);
    const onApply = vi.fn();

    render(<CouponField subtotal={80} applied={null} onApply={onApply} onRemove={() => {}} />);
    await userEvent.type(screen.getByLabelText("Cupom de desconto"), "pizza10");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(spy).toHaveBeenCalledWith("pizza10", 80);
    expect(onApply).toHaveBeenCalledWith(valid);
  });

  it("mostra a mensagem do backend quando o cupom não vale", async () => {
    vi.spyOn(couponService, "validateCoupon").mockRejectedValue(new Error("Cupom expirado"));
    render(<CouponField subtotal={80} applied={null} onApply={() => {}} onRemove={() => {}} />);

    await userEvent.type(screen.getByLabelText("Cupom de desconto"), "VELHO{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Cupom expirado");
  });

  it("exibe o cupom aplicado e permite remover", async () => {
    const onRemove = vi.fn();
    render(
      <CouponField
        subtotal={80}
        applied={{ code: "PIZZA10", description: "", discountType: "percentual", value: 10, discount: 8 }}
        onApply={() => {}}
        onRemove={onRemove}
      />
    );
    expect(screen.getByText("PIZZA10")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remover cupom PIZZA10" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
