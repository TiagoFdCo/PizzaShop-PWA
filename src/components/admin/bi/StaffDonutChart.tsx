/**
 * StaffDonutChart — participação de faturamento por entregador/garçom.
 * PieChart com innerRadius (rosca) para deixar espaço ao label central.
 */

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "../../../lib/formatCurrency";
import type { StaffBreakdown } from "../../../types/report";

interface StaffDonutChartProps {
  data: StaffBreakdown[];
}

// Paleta de cores rotativa
const COLORS = ["#C0392B", "#E74C3C", "#922B21", "#F1948A", "#FADBD8", "#78281F"];

const ROLE_LABEL: Record<string, string> = {
  entrega: "Entregador",
  garcom:  "Garçom",
};

export function StaffDonutChart({ data }: StaffDonutChartProps) {
  const chartData = data.map((d) => ({
    name:  `${d.name} (${ROLE_LABEL[d.role] ?? d.role})`,
    value: d.revenue,
  }));

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Faturamento por Entregador / Garçom
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) =>
              `${name.split(" (")[0]} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
