import { apiFetch } from "./api";
import type { Pizza } from "../types/product";

export function getProducts(): Promise<Pizza[]> {
  return apiFetch<Pizza[]>("/products");
}

export function getProductById(id: string): Promise<Pizza> {
  return apiFetch<Pizza>(`/products/${id}`);
}

export function createProduct(data: Omit<Pizza, "id">): Promise<Pizza> {
  return apiFetch<Pizza>("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: string, data: Partial<Pizza>): Promise<Pizza> {
  return apiFetch<Pizza>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}
