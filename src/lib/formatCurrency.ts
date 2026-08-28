export function formatCurrency(value: number | null | undefined): string {
  const safeValue = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return safeValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}