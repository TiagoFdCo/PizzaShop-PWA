import { Armchair, Plus } from "lucide-react";
import { formatCurrency } from "../../lib/formatCurrency";
import { tabName } from "../../lib/tabLabel";
import type { Tab } from "../../types/tab";
import type { Table } from "../../types/table";

interface TableCardProps {
  table: Table;
  /** Comandas ATIVAS da mesa (aberta ou fechada/aguardando pagamento). */
  tabs: Tab[];
  onOpenTab: (table: Table) => void;
  onViewTab: (tab: Tab) => void;
  onViewHistory: (table: Table) => void;
  loading?: boolean;
}

export function TableCard({
  table,
  tabs,
  onOpenTab,
  onViewTab,
  onViewHistory,
  loading = false,
}: TableCardProps) {
  const isAvailable = table.status === "livre";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-3 ${
              isAvailable
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            <Armchair size={22} />
          </div>

          <div>
            <p className="text-lg font-bold text-gray-900">
              Mesa {table.number}
            </p>

            <p
              className={`text-sm font-medium ${
                isAvailable ? "text-green-600" : "text-red-600"
              }`}
            >
              {isAvailable
                ? "Livre"
                : tabs.length > 0
                  ? `Ocupada · ${tabs.length} comanda${tabs.length > 1 ? "s" : ""}`
                  : "Ocupada"}
            </p>
          </div>
        </div>
      </div>

      {tabs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onViewTab(tab)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm transition hover:bg-gray-50"
              >
                <span>
                  <span className="font-semibold text-gray-900">{tabName(tab)}</span>
                  {tab.status === "fechada" && (
                    <span className="ml-2 text-xs font-medium text-amber-600">
                      aguardando pagamento
                    </span>
                  )}
                </span>
                <span className="text-gray-600">{formatCurrency(tab.total)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => onOpenTab(table)}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isAvailable
            ? "bg-primary text-white hover:opacity-90"
            : "border border-primary text-primary hover:bg-gray-50"
        }`}
      >
        <Plus size={16} />
        {loading ? "Abrindo..." : isAvailable ? "Abrir comanda" : "Nova comanda"}
      </button>

      <button
        type="button"
        onClick={() => onViewHistory(table)}
        className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
      >
        Histórico de comandas
      </button>
    </div>
  );
}