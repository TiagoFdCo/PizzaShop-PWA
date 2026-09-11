import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Receipt } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { listTabs } from "../../services/tabService";
import { formatCurrency } from "../../lib/formatCurrency";
import type { Tab, TabStatus } from "../../types/tab";

const STATUS_LABEL: Record<TabStatus, string> = {
  aberta: "Aberta",
  fechada: "Fechada",
  paga: "Paga",
};

const STATUS_TONE: Record<TabStatus, string> = {
  aberta: "bg-green-50 text-green-700",
  fechada: "bg-amber-50 text-amber-700",
  paga: "bg-gray-100 text-gray-600",
};

export function TableHistoryPage() {
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) {
      setError("Mesa não identificada.");
      setLoading(false);
      return;
    }

    listTabs({ tableId })
      .then(setTabs)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.")
      )
      .finally(() => setLoading(false));
  }, [tableId]);

  const tableNumber = tabs[0]?.tableNumber;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button
        onClick={() => navigate("/garcom/mesas")}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        Voltar para mesas
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Receipt size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Histórico {tableNumber ? `— Mesa ${tableNumber}` : ""}
          </h1>
          <p className="text-sm text-gray-500">
            Todas as comandas já abertas nesta mesa — uma mesa pode ter várias
            comandas ao longo do tempo, uma por vez.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Carregando histórico...</div>
      ) : tabs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="font-medium text-gray-700">Nenhuma comanda registrada nesta mesa ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(`/garcom/comanda/${tab.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <p className="font-mono text-xs text-gray-400">#{tab.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Aberta em {new Date(tab.openedAt).toLocaleString("pt-BR")}
                  {tab.closedAt && ` · Fechada em ${new Date(tab.closedAt).toLocaleString("pt-BR")}`}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{tab.orders.length} pedido(s) lançado(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{formatCurrency(tab.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[tab.status]}`}>
                  {STATUS_LABEL[tab.status]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
