import { useAuthStore } from "../../store/useAuthStore";
import { Button } from "../../components/ui/Button";

export function DeliveryPlaceholderPage() {
  const { session, logout } = useAuthStore();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
      <h1 className="text-xl font-semibold text-gray-800">Painel de Entrega</h1>
      <p className="text-sm text-gray-500">
        Logado como {session?.staff.name}. Tela de rotas de entrega ainda não foi entregue pelo P3.
      </p>
      <Button onClick={logout}>Sair</Button>
    </div>
  );
}