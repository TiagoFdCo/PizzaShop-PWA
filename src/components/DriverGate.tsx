import { useAuthStore } from "../store/useAuthStore";

interface DriverGateProps {
  login: React.ReactNode;
  app: React.ReactNode;
}

/**
 * Exibe a tela de login do entregador se não há sessão com role "entrega",
 * ou o app do entregador se a sessão for válida.
 */
export function DriverGate({ login, app }: DriverGateProps) {
  const session = useAuthStore((s) => s.session);

  if (session?.role === "entrega" && session.id) {
    return <>{app}</>;
  }

  return <>{login}</>;
}
