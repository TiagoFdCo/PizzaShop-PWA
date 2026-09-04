import { apiFetch } from "./api";
import type { Driver } from "../types/driver";

const ENDPOINT = "/staff";

export async function getDrivers(): Promise<Driver[]> {
  return apiFetch<Driver[]>(`${ENDPOINT}?role=entrega`);
}

export async function createDriver(data: { name: string; username: string; password: string }): Promise<Driver> {
  return apiFetch<Driver>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ ...data, role: "entrega" }),
  });
}

export async function deleteDriver(id: string): Promise<void> {
  await apiFetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
}