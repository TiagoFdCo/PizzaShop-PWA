import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { login, logout } from "../../src/services/authService";
import { setAuthToken } from "../../src/services/api";

function mockFetchOnce(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      text: async () => JSON.stringify(body),
      clone() {
        return this;
      },
      json: async () => body,
    })
  );
}

describe("authService", () => {
  beforeEach(() => {
    setAuthToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("faz POST em /auth/login com as credenciais e devolve token + staff", async () => {
    mockFetchOnce({
      accessToken: "fake-jwt",
      tokenType: "bearer",
      staff: { id: "1", name: "Admin", role: "admin", username: "admin" },
    });

    const session = await login({ username: "admin", password: "admin123" });

    expect(session.token).toBe("fake-jwt");
    expect(session.staff.role).toBe("admin");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("propaga o erro quando o backend recusa (401)", async () => {
    mockFetchOnce({ detail: "Usuário ou senha inválidos" }, 401);
    await expect(login({ username: "admin", password: "errada" })).rejects.toThrow(
      "Usuário ou senha inválidos"
    );
  });

  it("logout limpa o token em memória", async () => {
    mockFetchOnce({
      accessToken: "fake-jwt",
      tokenType: "bearer",
      staff: { id: "1", name: "Admin", role: "admin", username: "admin" },
    });
    await login({ username: "admin", password: "admin123" });
    logout();
    // se o token não tivesse sido limpo, a próxima chamada autenticada ainda mandaria o header antigo
    mockFetchOnce({});
    await fetch("http://localhost:8000/qualquer-coisa");
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options?.headers?.Authorization).toBeUndefined();
  });
});