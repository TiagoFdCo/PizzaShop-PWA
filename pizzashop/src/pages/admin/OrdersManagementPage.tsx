import { useOrders } from "../../hooks/useOrders";
import { OrdersTable } from "../../components/admin/OrdersTable";
import { Spinner } from "../../components/ui/Spinner";

// Tela "Gestão de pedidos" do painel admin.
// Junta o hook (dados + polling) com a tabela (apresentação).
export function OrdersManagementPage() {
  const { orders, loading, error, changeStatus } = useOrders();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600">Erro ao carregar pedidos: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Gestão de Pedidos</h1>
      <OrdersTable orders={orders} onStatusChange={changeStatus} />
    </div>
  );
}
