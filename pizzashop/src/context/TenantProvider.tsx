import { useEffect, type ReactNode } from "react";
import { useTenantStore } from "../store/useTenantStore";
import { useTheme } from "../hooks/useTheme";

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const loadTenant = useTenantStore((state) => state.loadTenant);
  const loading = useTenantStore((state) => state.loading);
  const error = useTenantStore((state) => state.error);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  // Aplica o tema (CSS vars) sempre que o tenant mudar
  useTheme();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-pulse text-sm text-gray-500">Carregando loja...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm text-red-500">Erro ao carregar configuração: {error}</span>
      </div>
    );
  }

  return <>{children}</>;
}
