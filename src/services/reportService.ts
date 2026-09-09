/**
 * reportService — Issue #75
 *
 * Funções de acesso à API de relatórios.
 * O download do Excel dispara um fetch autenticado e usa blob para
 * evitar ter que abrir uma nova janela sem o token de auth no header.
 */

import { apiFetch } from "./api";
import type { FinancialSummary, OrderLedgerRow } from "../types/report";

// ─── JSON endpoints ───────────────────────────────────────────────────────────

export function getFinancialSummary(): Promise<FinancialSummary> {
  return apiFetch<FinancialSummary>("/reports/summary");
}

export function getOrderLedger(): Promise<OrderLedgerRow[]> {
  return apiFetch<OrderLedgerRow[]>("/reports/ledger");
}

// ─── Excel download ───────────────────────────────────────────────────────────

/**
 * Faz fetch autenticado do .xlsx e dispara o download no navegador.
 * Não usa apiFetch porque a resposta não é JSON — é binário.
 */
export async function downloadReportXlsx(): Promise<void> {
  const REAL_API_BASE_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  // Recupera o token do localStorage da mesma forma que authService.ts faz
  const raw = localStorage.getItem("auth-store");
  const token: string | null = raw ? (JSON.parse(raw)?.state?.token ?? null) : null;

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${REAL_API_BASE_URL}/reports/export.xlsx`, { headers });

  if (!res.ok) {
    throw new Error(`Erro ${res.status} ao gerar o relatório Excel.`);
  }

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "relatorio_pizzashop.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
