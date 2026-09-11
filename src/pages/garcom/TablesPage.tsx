import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TableCard } from "../../components/garcom/TableCard";
import { listTables } from "../../services/tableService";
import { openTab, listTabs } from "../../services/tabService";
import { useAuthStore } from "../../store/useAuthStore";
import type { Table } from "../../types/table";

export function TablesPage() {
  const navigate = useNavigate();

  const session = useAuthStore((state) => state.session);

  const [tables, setTables] = useState<Table[]>([]);
  // Corrigido (bug: comanda aberta ficava inacessível depois de sair da
  // tela): mapa mesa -> id da comanda ABERTA daquela mesa, pra "Ver
  // comanda" navegar direto pra ela em vez de só saber abrir uma nova.
  const [openTabByTable, setOpenTabByTable] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openingTableId, setOpeningTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTables() {
    try {
      setLoading(true);
      setError(null);

      const [tablesData, openTabs] = await Promise.all([
        listTables(),
        listTabs({ status: "aberta" }),
      ]);
      setTables(tablesData);
      setOpenTabByTable(
        Object.fromEntries(openTabs.map((tab) => [tab.tableId, tab.id]))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as mesas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTables();
  }, []);

  async function handleOpenTab(table: Table) {
    if (!session?.staff.id) {
      setError("Não foi possível identificar o garçom logado.");
      return;
    }

    try {
      setOpeningTableId(table.id);
      setError(null);

      // O backend já altera a mesa para "ocupada" ao abrir a comanda.
      const tab = await openTab(table.id);

      navigate(`/garcom/comanda/${tab.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível abrir a comanda."
      );
    } finally {
      setOpeningTableId(null);
    }
  }

  function handleViewTab(table: Table) {
    const tabId = openTabByTable[table.id];
    if (!tabId) {
      setError(
        `A mesa ${table.number} está ocupada mas não encontrei a comanda aberta dela — atualize a página.`
      );
      return;
    }
    navigate(`/garcom/comanda/${tabId}`);
  }

  function handleViewHistory(table: Table) {
    navigate(`/garcom/mesas/${table.id}/historico`);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Utensils size={24} className="text-primary" />

            <h1 className="text-2xl font-bold text-gray-900">
              Mesas
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Selecione uma mesa livre para abrir uma comanda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTables()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Carregando mesas...
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="font-medium text-gray-700">
            Nenhuma mesa cadastrada.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Cadastre mesas para começar a atender.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onOpenTab={handleOpenTab}
              onViewTab={handleViewTab}
              onViewHistory={handleViewHistory}
              loading={openingTableId === table.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}