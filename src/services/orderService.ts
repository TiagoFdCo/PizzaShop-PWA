import { apiFetch } from "./api";
import type { DeliveryFailure, Order, OrderInput, OrderStatus } from "../types/order";

const ENDPOINT = "/orders";

// ─── Funções existentes ───────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>(ENDPOINT);
}

export async function getOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}`);
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const payload = {
    ...input,
    status: "recebido" as OrderStatus,
    createdAt: new Date().toISOString(),
    cook: null,
    driver: null,
  };
  return apiFetch<Order>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Funções do entregador ────────────────────────────────────────────────────

export async function getOrdersForDriver(driverId: string): Promise<Order[]> {
  const all = await getOrders();
  return all.filter(
    (o) => o.driver?.id === driverId && o.status === "saiu_para_entrega"
  );
}

export async function markOrderDelivered(orderId: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "entregue" as OrderStatus }),
  });
}

export async function markOrderFailed(
  orderId: string,
  failure: DeliveryFailure
): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "falha_entrega" as OrderStatus,
      deliveryFailure: failure,
    }),
  });
}
