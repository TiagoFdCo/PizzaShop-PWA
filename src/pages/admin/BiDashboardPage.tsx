/**
 * BiDashboardPage — Painel de Business Intelligence (Issue #75).
 *
 * Rota sugerida: /admin/bi  (adicionar em router.tsx e no NAV_ITEMS do AdminLayout)
 *
 * Flag useMock:
 *   - true  → usa os dados mock embutidos no CRUD do backend (REPORTS_USE_MOCK=true)
 *             OU substitui diretamente aqui para desenvolvimento puramente front-end.
 *   - false → chama GET /reports/summary normalmente.
 *
 * Em produção basta garantir que o backend retorna dados reais.
 */

import { Download, TrendingUp, Star, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { KpiCard }          from "../../components/admin/bi/KpiCard";
import { RevenueBarChart }  from "../../components/admin/bi/RevenueBarChart";
import { StaffDonutChart }  from "../../components/admin/bi/StaffDonutChart";
import { Spinner }          from "../../components/ui/Spinner";
import { useFetch }         from "../../hooks/useFetch";
import { formatCurrency }   from "../../lib/formatCurrency";
import { downloadReportXlsx, getFinancialSummary } from "../../services/reportService";
import type { FinancialSummary } from "../../types/report";

// ─── Dados mock locais para renderização sem backend ─────────────────────────
// Remova este bloco e ajuste useMock=false quando o endpoint /reports/summary
// estiver disponível no servidor.
const USE_MOCK_LOCAL = false; // mude para true se quiser ignorar o backend completamente

const MOCK_DATA: FinancialSummary = {
  totalRevenue: 18_450.0,
  totalCost:     7_380.0,
  grossProfit:  11_070.0,
  averageRating: 4.3,
  ordersCount:   142,
  channelBreakdown: [
    { channel: "delivery", revenue: 12_100, cost: 4_840, profit: 7_260 },
    { channel: "dine_in",  revenue:  6_350, cost: 2_540, profit: 3_810 },
  ],
  staffBreakdown: [
    { staffId: "s1", name: "Carlos",  role: "entrega", ordersCount: 58, revenue: 7_250 },
    { staffId: "s2", name: "Beatriz", role: "entrega", ordersCount: 44, revenue: 4_850 },
    { staffId: "s3", name: "Lucas",   role: "garcom",  ordersCount: 40, revenue: 6_350 },
  ],
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function BiDashboardPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: fetched, loading, error } = useFetch(
    () => USE_MOCK_LOCAL ? Promise.resolve(MOCK_DATA) : getFinancialSummary(),
    [],
  );

  const summary = fetched ?? (USE_MOCK_LOCAL ? MOCK_DATA : null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadReportXlsx();
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Erro ao baixar o relatório.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Painel BI</h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-50"
        >
          <Download size={16} />
          {downloading ? "Gerando..." : "Exportar Excel"}
        </button>
      </div>

      {downloadError && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {downloadError}
        </p>
      )}

      {loading && <Spinner label="Carregando relatório..." />}
      {error && !USE_MOCK_LOCAL && (
        <p className="text-sm text-red-600">
          Não foi possível carregar os dados. {error}
        </p>
      )}

      {summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Faturamento Total"
              value={formatCurrency(summary.totalRevenue)}
              icon={<TrendingUp size={14} />}
              variant="neutral"
            />
            <KpiCard
              label="Lucro Bruto"
              value={formatCurrency(summary.grossProfit)}
              icon={<TrendingUp size={14} />}
              variant="green"
            />
            <KpiCard
              label="Pedidos Entregues"
              value={summary.ordersCount}
              icon={<ShoppingBag size={14} />}
              variant="neutral"
            />
            <KpiCard
              label="Avaliação Média"
              value={
                summary.averageRating !== null
                  ? `${summary.averageRating.toFixed(1)} ★`
                  : "—"
              }
              icon={<Star size={14} />}
              variant={
                summary.averageRating !== null && summary.averageRating >= 4
                  ? "green"
                  : "neutral"
              }
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RevenueBarChart data={summary.channelBreakdown} />
            <StaffDonutChart data={summary.staffBreakdown} />
          </div>

          {/* Indicadores extras */}
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Margem Bruta por Canal
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase text-gray-400">
                  <th className="pb-2">Canal</th>
                  <th className="pb-2 text-right">Faturamento</th>
                  <th className="pb-2 text-right">Custo</th>
                  <th className="pb-2 text-right">Lucro</th>
                  <th className="pb-2 text-right">Margem %</th>
                </tr>
              </thead>
              <tbody>
                {summary.channelBreakdown.map((ch) => {
                  const margin =
                    ch.revenue > 0 ? ((ch.profit / ch.revenue) * 100).toFixed(1) : "—";
                  return (
                    <tr key={ch.channel} className="border-t border-gray-100">
                      <td className="py-2 font-medium">
                        {ch.channel === "delivery" ? "Delivery" : "Presencial"}
                      </td>
                      <td className="py-2 text-right">{formatCurrency(ch.revenue)}</td>
                      <td className="py-2 text-right text-red-600">{formatCurrency(ch.cost)}</td>
                      <td className="py-2 text-right text-green-600">{formatCurrency(ch.profit)}</td>
                      <td className="py-2 text-right text-gray-500">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
