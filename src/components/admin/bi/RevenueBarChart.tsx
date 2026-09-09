/**
 * RevenueBarChart — Faturamento / Custo / Lucro por canal de venda.
 * Usa Recharts BarChart (já adicionado como dependência em package.json).
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../../lib/formatCurrency";
import type { ChannelSummary } from "../../../types/report";

interface RevenueBarChartProps {
  data: ChannelSummary[];
}

const CHANNEL_LABEL: Record<string, string> = {
  delivery: "Delivery",
  dine_in:  "Presencial",
};

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  const chartData = data.map((d) => ({
    canal:       CHANNEL_LABEL[d.channel] ?? d.channel,
    Faturamento: d.revenue,
    Custo:       d.cost,
    Lucro:       d.profit,
  }));

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Faturamento · Custo · Lucro por Canal
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Faturamento" fill="#C0392B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Custo"       fill="#E74C3C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Lucro"       fill="#27AE60" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
