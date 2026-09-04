import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useAuthStore } from "../../src/store/useAuthStore";

function renderProtected(initialPath: string, allowedRoles?: ("admin" | "cozinha" | "entrega")[]) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin" element={<div>Tela de login</div>} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/protegida" element={<div>Conteúdo protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, isAuthenticated: false, loading: false, error: null });
  });

  it("redireciona pro login quando não está autenticado", () => {
    renderProtected("/protegida");
    expect(screen.getByText("Tela de login")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("mostra o conteúdo quando autenticado e sem restrição de papel", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      session: { token: "x", staff: { id: "1", name: "Admin", role: "admin", username: "admin" } },
    });
    renderProtected("/protegida");
    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("redireciona quando autenticado mas com papel fora da lista permitida", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      session: { token: "x", staff: { id: "1", name: "Cozinha", role: "cozinha", username: "cozinha" } },
    });
    renderProtected("/protegida", ["admin"]);
    expect(screen.getByText("Tela de login")).toBeInTheDocument();
  });

  it("libera quando o papel do usuário está na lista permitida", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      session: { token: "x", staff: { id: "1", name: "Cozinha", role: "cozinha", username: "cozinha" } },
    });
    renderProtected("/protegida", ["cozinha", "entrega"]);
    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });
});