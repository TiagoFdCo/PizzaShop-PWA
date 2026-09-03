import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore } from "../../src/store/useAuthStore";

function mockLoginResponse(staff: { role: "admin" | "cozinha" | "entrega" }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          accessToken: "fake-jwt",
          tokenType: "bearer",
          staff: { id: "1", name: "Fulano", username: "fulano", ...staff },
        }),
      clone() {
        return this;
      },
    })
  );
}

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, isAuthenticated: false, loading: false, error: null });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("login bem-sucedido marca isAuthenticated e guarda a sessão", async () => {
    mockLoginResponse({ role: "admin" });
    await useAuthStore.getState().login({ username: "admin", password: "admin123" });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.session?.staff.role).toBe("admin");
  });

  it("login com falha guarda o erro e não autentica", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ detail: "Credenciais inválidas" }),
        clone() {
          return this;
        },
        json: async () => ({ detail: "Credenciais inválidas" }),
      })
    );

    await expect(
      useAuthStore.getState().login({ username: "admin", password: "errada" })
    ).rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Credenciais inválidas");
  });

  it("hasRole confere o papel da sessão atual", async () => {
    mockLoginResponse({ role: "cozinha" });
    await useAuthStore.getState().login({ username: "cozinha", password: "123" });

    expect(useAuthStore.getState().hasRole(["cozinha"])).toBe(true);
    expect(useAuthStore.getState().hasRole(["admin", "entrega"])).toBe(false);
  });

  it("logout limpa a sessão", async () => {
    mockLoginResponse({ role: "admin" });
    await useAuthStore.getState().login({ username: "admin", password: "admin123" });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});