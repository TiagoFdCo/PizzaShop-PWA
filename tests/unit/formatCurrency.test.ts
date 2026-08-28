import { describe, it, expect } from "vitest";
import { formatCurrency } from "../../src/lib/formatCurrency";

describe("formatCurrency", () => {
  it("formata um número positivo como moeda BRL", () => {
    expect(formatCurrency(39.9)).toBe("R$\u00A039,90");
  });

  it("formata zero corretamente", () => {
    expect(formatCurrency(0)).toBe("R$\u00A00,00");
  });

  it("arredonda para duas casas decimais", () => {
    expect(formatCurrency(10.005)).toBe("R$\u00A010,01");
  });

  it("formata valores grandes com separador de milhar", () => {
    expect(formatCurrency(1234.5)).toBe("R$\u00A01.234,50");
  });
});