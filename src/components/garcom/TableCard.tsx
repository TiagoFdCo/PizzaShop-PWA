import { Armchair } from "lucide-react";
import type { Table } from "../../types/table";

interface TableCardProps {
  table: Table;
  onOpenTab: (table: Table) => void;
  onViewTab: (table: Table) => void;
  onViewHistory: (table: Table) => void;
  loading?: boolean;
}

export function TableCard({
  table,
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
              {isAvailable ? "Livre" : "Ocupada"}
            </p>
          </div>
        </div>
      </div>

      {isAvailable ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => onOpenTab(table)}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Abrindo..." : "Abrir comanda"}
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => onViewTab(table)}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Abrindo..." : "Ver comanda"}
        </button>
      )}

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