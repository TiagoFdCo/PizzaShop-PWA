import { apiFetch } from "./api";
import type { Order, OrderStatus } from "../types/order";

export function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/orders");
}

export function getOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

export function createOrder(
  data: Omit<Order, "id" | "status" | "createdAt">
): Promise<Order> {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      status: "recebido",
      createdAt: new Date().toISOString(),
    }),
  });
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
