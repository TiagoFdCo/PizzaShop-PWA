/**
 * financeService — despesas administrativas (Financeiro).
 * Persistido no backend (/expenses), não mais em localStorage: assim fica
 * compartilhado entre dispositivos/usuários e sobrevive a limpar o navegador.
 */
import { apiFetch } from "./api";
import type { Expense } from "../types/finance";

const EXPENSES_ENDPOINT = "/expenses";

export async function getExpenses(): Promise<Expense[]> {
  return apiFetch<Expense[]>(EXPENSES_ENDPOINT);
}

export async function createExpense(input: Omit<Expense, "id">): Promise<Expense> {
  return apiFetch<Expense>(EXPENSES_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await apiFetch<void>(`${EXPENSES_ENDPOINT}/${id}`, {
    method: "DELETE",
  });
}
