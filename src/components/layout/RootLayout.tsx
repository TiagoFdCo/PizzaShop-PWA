import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TenantProvider } from "../../context/TenantProvider";

// Envolve toda a árvore de rotas (loja + admin): carrega o tenantConfig
// no boot e injeta o tema via CSS Variables antes de renderizar qualquer página.
export function RootLayout() {
  useEffect(() => {
    // O app carregou de verdade — libera o "reload automático" do
    // RouteErrorBoundary pra poder disparar de novo numa próxima vez
    // (senão, depois do 1º reload automático, uma futura falha real de
    // chunk ficaria presa sem nunca mais recarregar sozinha).
    sessionStorage.removeItem("pizzashop:chunk-reload-attempted");
  }, []);

  return (
    <TenantProvider>
      <Outlet />
    </TenantProvider>
  );
}
