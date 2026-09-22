// Fase 4 (P3) — fidelidade do cliente logado
import { ApiError, apiFetch } from "./api";
import type { LoyaltyAccount } from "../types/loyalty";

/**
 * Saldo + extrato do cliente logado. Devolve `null` quando não há cliente
 * logado (401) — assim a tela não precisa saber como o P1 guarda a sessão:
 * se o token de cliente estiver no apiFetch, funciona; se não, some.
 */
export async function getMyLoyalty(): Promise<LoyaltyAccount | null> {
  try {
    return await apiFetch<LoyaltyAccount>("/loyalty/me");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}
