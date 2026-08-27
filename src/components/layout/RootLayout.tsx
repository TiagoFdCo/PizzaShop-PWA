import { Outlet } from "react-router-dom";
import { TenantProvider } from "../../context/TenantProvider";

// Envolve toda a árvore de rotas (loja + admin): carrega o tenantConfig
// no boot e injeta o tema via CSS Variables antes de renderizar qualquer página.
export function RootLayout() {
  return (
    <TenantProvider>
      <Outlet />
    </TenantProvider>
  );
}
