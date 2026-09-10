import { apiFetch } from "./api";
import type { Table, TableStatus } from "../types/table";

const TABLES_ENDPOINT = "/tables";

export async function listTables(): Promise<Table[]> {
  return apiFetch<Table[]>(TABLES_ENDPOINT, {
    useMockApi: true,
  });
}

export async function updateTableStatus(
  tableId: string,
  status: TableStatus
): Promise<Table> {
  return apiFetch<Table>(`${TABLES_ENDPOINT}/${tableId}`, {
    method: "PATCH",
    useMockApi: true,
    body: JSON.stringify({ status }),
  });
}