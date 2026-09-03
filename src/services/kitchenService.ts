import { apiFetch } from "./api";
import type { Order } from "../types/order";
import type { Staff } from "../types/staff";

const ORDERS_ENDPOINT = "/orders";

// Mock temporário para testar a interface antes da integração com o backend da P1.
const MOCK_DRIVERS: Staff[] = [
  { id: "driver-1", name: "Carlos Silva", role: "entrega", username: "carlos" },
  { id: "driver-2", name: "João Santos", role: "entrega", username: "joao" },
  { id: "driver-3", name: "Marcos Oliveira", role: "entrega", username: "marcos" },
];

export const MOCK_COOK: Staff = {
  id: "cook-1",
  name: "Cozinheiro da Bella Napoli",
  role: "cozinha",
  username: "cozinha",
};

export async function getKitchenOrders(): Promise<Order[]> {
  return apiFetch<Order[]>(ORDERS_ENDPOINT);
}

export async function getDrivers(): Promise<Staff[]> {
  try {
    return await apiFetch<Staff[]>("/staff?role=entrega");
  } catch {
    return MOCK_DRIVERS;
  }
}

async function updateMockStatus(id: string, status: Order["status"], extra: Record<string, unknown> = {}) {
  return apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...extra }),
  });
}

// As tentativas específicas usam os endpoints FastAPI previstos no plano.
// O fallback permite continuar testando a UI no json-server atual.
export async function claimOrderForCooking(id: string, cook: Staff): Promise<Order> {
  try {
    return await apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}/claim`, { method: "PATCH" });
  } catch {
    return updateMockStatus(id, "preparo", { cook: { id: cook.id, name: cook.name } });
  }
}

export async function markOrderReady(id: string): Promise<Order> {
  try {
    return await apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}/ready`, { method: "PATCH" });
  } catch {
    return updateMockStatus(id, "pronto_entrega");
  }
}

export async function dispatchOrder(id: string, driver: Staff): Promise<Order> {
  try {
    return await apiFetch<Order>(`${ORDERS_ENDPOINT}/${id}/dispatch`, {
      method: "PATCH",
      body: JSON.stringify({ driver_id: driver.id }),
    });
  } catch {
    return updateMockStatus(id, "saiu_para_entrega", {
      driver: { id: driver.id, name: driver.name },
    });
  }
}
