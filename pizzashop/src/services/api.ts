// Camada base de acesso HTTP. Único ponto do projeto autorizado a chamar fetch diretamente.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Erro ${res.status} ao acessar ${path}`);
  }

  // DELETE geralmente não retorna corpo
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
