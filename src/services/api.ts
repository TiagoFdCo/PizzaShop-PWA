// Única camada autorizada a chamar fetch (100% fetch nativo — Axios é proibido pelo enunciado).
// Centraliza base URL, headers e tratamento de erro HTTP/JSON para todos os outros services.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API mock. Verifique se ela está rodando (`npm run mock-api`).",
      0
    );
  }

  if (!res.ok) {
    throw new ApiError(`Erro ${res.status} ao acessar ${path}`, res.status);
  }

  // DELETE geralmente retorna corpo vazio
  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(`A API retornou uma resposta inválida para ${path}`, res.status);
  }
}
