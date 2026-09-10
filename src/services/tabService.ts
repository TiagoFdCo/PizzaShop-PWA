import { apiFetch } from "./api";
import type { Tab } from "../types/tab";

const TABS_ENDPOINT = "/tabs";

export interface OpenTabInput {
  tableId: string;
  waiterId: string;
}

export async function openTab(input: OpenTabInput): Promise<Tab> {
  return apiFetch<Tab>(TABS_ENDPOINT, {
    method: "POST",
    useMockApi: true,
    body: JSON.stringify({
      tableId: input.tableId,
      waiterId: input.waiterId,
      status: "aberta",
      orderIds: [],
    }),
  });
}