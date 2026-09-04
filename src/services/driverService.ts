import { apiFetch } from "./api";
import type { Staff } from "../types/staff";

// O backend usa /staff com role=entrega — não existe rota /drivers.
// Driver é só um Staff com role "entrega".
export type Driver = Staff;

const STAFF_ENDPOINT = "/staff";

export async function getDrivers(): Promise<Driver[]> {
  return apiFetch<Driver[]>(`${STAFF_ENDPOINT}?role=entrega`);
}

export async function createDriver(data: {
  name: string;
  username: string;
  password: string;
}): Promise<Driver> {
  return apiFetch<Driver>(STAFF_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ ...data, role: "entrega" }),
  });
}

export async function deleteDriver(id: string): Promise<void> {
  // O backend não tem DELETE /staff/:id ainda.
  // Quando implementado, descomentar:
  // await apiFetch(`${STAFF_ENDPOINT}/${id}`, { method: "DELETE" });
  throw new Error("Remoção de entregadores ainda não implementada no backend.");
}