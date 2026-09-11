/**
 * reportService — Issue #75
 *
 * Funções de acesso à API de relatórios.
 * O download do Excel dispara um fetch autenticado e usa blob para
 * evitar ter que abrir uma nova janela sem o token de auth no header.
 */

import { apiFetch, getAuthToken } from "./api";
import type { FinancialSummary, OrderLedgerRow } from "../types/report";

// ─── JSON endpoints ───────────────────────────────────────────────────────────

export function getFinancialSummary(): Promise<FinancialSummary> {
  return apiFetch<FinancialSummary>("/reports/summary");
}

export function getOrderLedger(): Promise<OrderLedgerRow[]> {
  return apiFetch<OrderLedgerRow[]>("/reports/ledger");
}

// ─── Downloads binários (Excel/PDF) ───────────────────────────────────────────

/**
 * Faz fetch autenticado de um arquivo binário e dispara o download no
 * navegador. Não usa apiFetch porque a resposta não é JSON.
 */
async function downloadBinaryReport(path: string, filename: string, label: string): Promise<void> {
  const REAL_API_BASE_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  // Corrigido: antes lia localStorage.getItem("auth-store") -> state.token,
  // uma chave/caminho que nunca existiu de verdade (o zustand persist do
  // useAuthStore usa a chave "pizzashop-staff-auth" e guarda o token em
  // state.session.token). Isso fazia o download SEMPRE ir sem Authorization
  // — por isso o 401, mesmo logado. Agora usa a mesma fonte que todo o
  // resto da API já usa (setAuthToken/getAuthToken em api.ts).
  const token = getAuthToken();

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${REAL_API_BASE_URL}${path}`, { headers });

  if (!res.ok) {
    // Tenta extrair o "detail" do FastAPI (ex.: "reportlab não está
    // instalado no servidor") em vez de só o código HTTP — senão a pessoa
    // não sabe se é 503 (dependência faltando), 401 (sessão expirada) ou
    // outra coisa qualquer.
    let detail: string | null = null;
    try {
      const body = await res.clone().json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // corpo não era JSON — segue só com o status
    }
    throw new Error(detail ?? `Erro ${res.status} ao gerar o relatório ${label}.`);
  }

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadReportXlsx(): Promise<void> {
  return downloadBinaryReport("/reports/export.xlsx", "relatorio_pizzashop.xlsx", "Excel");
}

export function downloadReportPdf(): Promise<void> {
  return downloadBinaryReport("/reports/export.pdf", "relatorio_pizzashop.pdf", "PDF");
}
