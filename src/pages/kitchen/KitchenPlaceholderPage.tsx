import { useAuthStore } from "../../store/useAuthStore";
import { Button } from "../../components/ui/Button";

export function KitchenPlaceholderPage() {
  const { session, logout } = useAuthStore();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
      <h1 className="text-xl font-semibold text-gray-800">Painel da Cozinha</h1>
      <p className="text-sm text-gray-500">
        Logado como {session?.staff.name}. Tela de pedidos em preparo ainda não foi entregue pelo P2.
      </p>
      <Button onClick={logout}>Sair</Button>
    </div>
  );
}