// Fase 4 (P3) — regras de prévia da fidelidade
import { describe, it, expect } from "vitest";
import { maxRedeemablePoints, pointsForAmount, pointsToReais } from "../../src/lib/loyalty";

const rules = { pointsPerReal: 1, redeemBlock: 100, reaisPerBlock: 10 };

describe("lib/loyalty", () => {
  it("converte pontos em reais pelo bloco", () => {
    expect(pointsToReais(100, rules)).toBe(10);
    expect(pointsToReais(300, rules)).toBe(30);
  });

  it("ganha 1 ponto por real, arredondando pra baixo", () => {
    expect(pointsForAmount(57.9, rules)).toBe(57);
    expect(pointsForAmount(0, rules)).toBe(0);
  });

  it("limita o resgate pelo saldo", () => {
    expect(maxRedeemablePoints(250, 500, rules)).toBe(200);
  });

  it("limita o resgate pelo valor restante do pedido", () => {
    expect(maxRedeemablePoints(1000, 35, rules)).toBe(300);
  });

  it("não deixa resgatar com saldo abaixo de um bloco", () => {
    expect(maxRedeemablePoints(99, 500, rules)).toBe(0);
  });
});
