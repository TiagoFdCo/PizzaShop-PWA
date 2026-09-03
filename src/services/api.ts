const REAL_API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const MOCK_API_BASE_URL = import.meta.env.VITE_MOCK_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}

interface ApiFetchOptions extends RequestInit {
  useMockApi?: boolean; // true só pra /orders, até o P2 terminar os endpoints reais
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const base = options?.useMockApi ? MOCK_API_BASE_URL : REAL_API_BASE_URL;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new ApiError(`Não foi possível conectar à API (${base}). Verifique se ela está rodando.`, 0);
  }

  if (!res.ok) {
    let message = `Erro ${res.status} ao acessar ${path}`;
    try {
      const body = await res.clone().json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // corpo não era JSON
    }
    throw new ApiError(message, res.status);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}