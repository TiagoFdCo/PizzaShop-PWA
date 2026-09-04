import { apiFetch } from "./api";
import type { DeliveryFailure, Order, OrderInput, OrderStaffRef, OrderStatus } from "../types/order";

const ENDPOINT = "/orders";

// Igual ao padrão do kitchenService: tenta o endpoint real da API (previsto
// no plano), e cai pro PATCH genérico do mock se o backend ainda não tiver
// essa rota implementada (caso de /orders hoje — fase P2 em andamento).
async function updateMockStatus(
  id: string,
  status: OrderStatus,
  extra: Record<string, unknown> = {}
): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...extra }),
    useMockApi: true,
  });
}

export async function getOrders(): Promise<Order[]> {
  try {
    return await apiFetch<Order[]>(ENDPOINT);
  } catch {
    return apiFetch<Order[]>(ENDPOINT, { useMockApi: true });
  }
}

export async function getOrderById(id: string): Promise<Order> {
  try {
    return await apiFetch<Order>(`${ENDPOINT}/${id}`);
  } catch {
    return apiFetch<Order>(`${ENDPOINT}/${id}`, { useMockApi: true });
  }
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const payload = {
    ...input,
    status: "recebido" as OrderStatus,
    createdAt: new Date().toISOString(),
    cook: null,
    driver: null,
  };
  try {
    return await apiFetch<Order>(ENDPOINT, { method: "POST", body: JSON.stringify(payload) });
  } catch {
    return apiFetch<Order>(ENDPOINT, { method: "POST", body: JSON.stringify(payload), useMockApi: true });
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return updateMockStatus(id, status);
}

// ─── Funções do entregador ────────────────────────────────────────────────────

export async function getOrdersForDriver(driverId: string): Promise<Order[]> {
  const all = await getOrders();
  return all.filter((o) => o.driver?.id === driverId && o.status === "saiu_para_entrega");
}

export async function markOrderDelivered(orderId: string): Promise<Order> {
  try {
    return await apiFetch<Order>(`${ENDPOINT}/${orderId}/delivered`, { method: "PATCH" });
  } catch {
    return updateMockStatus(orderId, "entregue");
  }
}

export async function markOrderFailed(orderId: string, failure: DeliveryFailure): Promise<Order> {
  try {
    return await apiFetch<Order>(`${ENDPOINT}/${orderId}/failed`, {
      method: "PATCH",
      body: JSON.stringify({ reason: failure.reason, description: failure.description }),
    });
  } catch {
    return updateMockStatus(orderId, "falha_entrega", { deliveryFailure: failure });
  }
}

export type { OrderStaffRef };