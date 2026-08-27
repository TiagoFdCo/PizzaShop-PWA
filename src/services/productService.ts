import { apiFetch } from "./api";
import type { Pizza, PizzaInput } from "../types/product";

const ENDPOINT = "/products";

export async function getProducts(): Promise<Pizza[]> {
  return apiFetch<Pizza[]>(ENDPOINT);
}

export async function getProductById(id: string): Promise<Pizza> {
  return apiFetch<Pizza>(`${ENDPOINT}/${id}`);
}

export async function createProduct(input: PizzaInput): Promise<Pizza> {
  return apiFetch<Pizza>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(id: string, input: PizzaInput): Promise<Pizza> {
  return apiFetch<Pizza>(`${ENDPOINT}/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(`${ENDPOINT}/${id}`, { method: "DELETE" });
}
