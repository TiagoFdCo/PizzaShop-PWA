import { apiFetch } from "./api";
import type { CartItem } from "../types/order";
import type { Tab, TabStatus } from "../types/tab";

const TABS_ENDPOINT = "/tabs";

function mapCartItem(item: CartItem) {
  return {
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    size: item.size,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    notes: item.notes ?? null,
    toppings: item.toppings.map((topping) => ({
      name: topping.name,
      price: topping.price,
    })),
  };
}

export async function openTab(tableId: string): Promise<Tab> {
  return apiFetch<Tab>(TABS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      tableId,
    }),
  });
}

export async function getTab(tabId: string): Promise<Tab> {
  return apiFetch<Tab>(`${TABS_ENDPOINT}/${tabId}`);
}

/**
 * Lista comandas — usado tanto pra achar a comanda ABERTA de uma mesa
 * ocupada (reentrar nela) quanto pro histórico de comandas já fechadas
 * de uma mesa (1 mesa : N comandas ao longo do tempo).
 */
export async function listTabs(params?: { status?: TabStatus; tableId?: string }): Promise<Tab[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.tableId) query.set("tableId", params.tableId);
  const qs = query.toString();
  return apiFetch<Tab[]>(`${TABS_ENDPOINT}${qs ? `?${qs}` : ""}`);
}

export async function addItemsToTab(
  tabId: string,
  items: CartItem[]
): Promise<Tab> {
  return apiFetch<Tab>(`${TABS_ENDPOINT}/${tabId}/orders`, {
    method: "POST",
    body: JSON.stringify({
      items: items.map(mapCartItem),
    }),
  });
}

export async function closeTab(tabId: string): Promise<Tab> {
  return apiFetch<Tab>(`${TABS_ENDPOINT}/${tabId}/close`, {
    method: "PATCH",
  });
}

export async function payTab(tabId: string): Promise<Tab> {
  return apiFetch<Tab>(`${TABS_ENDPOINT}/${tabId}/pay`, {
    method: "PATCH",
  });
}
