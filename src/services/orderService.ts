import { apiFetch } from "./api";
import type { Order, OrderInput, OrderStatus } from "../types/order";

const ENDPOINT = "/orders";

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
  };
  return apiFetch<Order>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Admin muda o status; a tela de acompanhamento do cliente lê o mesmo recurso via polling.
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
