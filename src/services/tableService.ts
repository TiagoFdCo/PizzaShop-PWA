import { apiFetch } from "./api";
import type { Table, TableStatus } from "../types/table";

const TABLES_ENDPOINT = "/tables";

// Corrigido: antes chamava a API mock (json-server) com "até o P2 terminar
// os endpoints reais" — os endpoints reais (/tables, /tables/{id}/status)
// já existem no backend FastAPI há tempo. Passou a chamar a API real.
export async function listTables(): Promise<Table[]> {
  return apiFetch<Table[]>(TABLES_ENDPOINT);
}

export async function updateTableStatus(
  tableId: string,
  status: TableStatus
): Promise<Table> {
  // Corrigido: rota real é PATCH /tables/{id}/status, não /tables/{id}.
  return apiFetch<Table>(`${TABLES_ENDPOINT}/${tableId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
