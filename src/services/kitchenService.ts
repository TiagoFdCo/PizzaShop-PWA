import { apiFetch } from "./api";
import type { Order } from "../types/order";
import type { Staff } from "../types/staff";

const ORDERS_ENDPOINT = "/orders";

export async function getKitchenOrders(): Promise<Order[]> {
  return apiFetch<Order[]>(ORDERS_ENDPOINT);
}

export async function getDrivers(): Promise<Staff[]> {
  return apiFetch<Staff[]>("/staff?role=entrega");
}

export async function claimOrderForCooking(id: string): Promise<Order> {
  return apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}/claim`, { method: "PATCH" });
}

export async function markOrderReady(id: string): Promise<Order> {
  return apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}/ready`, { method: "PATCH" });
}

export async function dispatchOrder(id: string, driver: Staff): Promise<Order> {
  return apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}/dispatch`, {
    method: "PATCH",
    body: JSON.stringify({ driverId: driver.id }),
  });
}
