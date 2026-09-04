import { apiFetch } from "./api";
import type { DeliveryFailure, Order, OrderInput, OrderStaffRef, OrderStatus } from "../types/order";

const ENDPOINT = "/orders";

// ─── Leitura (staff autenticado) ──────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>(ENDPOINT);
}

export async function getOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}`);
}

// ─── Rastreamento público (cliente, sem auth) ──────────────────────────────

/**
 * Endpoint público — não exige JWT.
 * Usado pela tela /pedido/:id que o cliente acessa sem estar logado.
 */
export async function trackOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${id}/track`);
}

// ─── Criação do pedido ────────────────────────────────────────────────────

export async function createOrder(input: OrderInput): Promise<Order> {
  // Envia somente os campos que o backend espera (OrderInput no schema Pydantic).
  // id, status, createdAt, cook, driver são gerados pelo backend — não enviamos.
  // cartItemId é chave do carrinho — não vai pro backend.
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
        // id do topping não vai pro backend: OrderItemToppingInput só quer name/price
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

// ─── Ações do admin ────────────────────────────────────────────────────────

/**
 * Admin pode forçar qualquer transição de status via PATCH /orders/{id}/status.
 * As regras de negócio (cozinha→ready, driver→delivered etc.) existem nos
 * endpoints específicos; este é um override administrativo.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  return apiFetch<Order>(`${ENDPOINT}/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Ações do entregador ───────────────────────────────────────────────────

export async function getOrdersForDriver(driverId: string): Promise<Order[]> {
  // GET /orders já filtra por driver no backend quando role=entrega.
  // O filtro local é redundante mas seguro (belt + suspenders).
  const all = await getOrders();
  return all.filter(
    (o) => o.driver?.id === driverId && o.status === "saiu_para_entrega"
  );
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
