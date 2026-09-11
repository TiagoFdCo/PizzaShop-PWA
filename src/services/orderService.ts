import { apiFetch } from "./api";
import type { DeliveryFailure, Order, OrderInput, OrderStaffRef, OrderStatus } from "../types/order";

const ENDPOINT = "/orders";

export async function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>(ENDPOINT);
}

export async function getOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}`);
}

export async function trackOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}/track`);
}

export async function rateOrder(id: string, stars: number): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}/rating`, {
    method: "POST",
    body: JSON.stringify({ stars }),
  });
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const payload = {
    items: input.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      notes: item.notes ?? null,
      toppings: item.toppings.map((t) => ({
        name: t.name,
        price: t.price,
      })),
    })),
    customer: input.customer,
    paymentMethod: input.paymentMethod,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    total: input.total,
  };

  return apiFetch<Order>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getOrdersForDriver(driverId: string): Promise<Order[]> {
  const all = await getOrders();
  return all.filter(
    (o) => o.driver?.id === driverId && o.status === "saiu_para_entrega"
  );
}

/** Entregas já concluídas por este entregador, com a nota que o cliente deu (se já avaliou). */
export async function getDeliveredOrdersForDriver(driverId: string): Promise<Order[]> {
  const all = await getOrders();
  return all
    .filter((o) => o.driver?.id === driverId && o.status === "entregue")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markOrderDelivered(orderId: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${orderId}/delivered`, { method: "PATCH" });
}

export async function markOrderFailed(
  orderId: string,
  failure: DeliveryFailure
): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${orderId}/failed`, {
    method: "PATCH",
    body: JSON.stringify({
      reason: failure.reason,
      description: failure.description ?? null,
    }),
  });
}

export type { OrderStaffRef };