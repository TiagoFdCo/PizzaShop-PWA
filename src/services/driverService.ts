import { apiFetch } from "./api";
import type { Driver } from "../types/driver";

const ENDPOINT = "/drivers";

export async function getDrivers(): Promise<Driver[]> {
  return apiFetch<Driver[]>(ENDPOINT);
}

export async function createDriver(data: Omit<Driver, "id">): Promise<Driver> {
  return apiFetch<Driver>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteDriver(id: string): Promise<void> {
  await apiFetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
}

/** Autentica entregador por usuário + senha. Retorna null se inválido. */
export async function loginDriver(
  username: string,
  password: string
): Promise<Driver | null> {
  const drivers = await getDrivers();
  return drivers.find((d) => d.username === username && d.password === password) ?? null;
}
