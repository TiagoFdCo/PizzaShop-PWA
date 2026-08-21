interface DashboardStatsProps {
  ordersToday: number;
  revenueToday: number;
  ordersMonth: number;
  revenueMonth: number;
}

// Cartões de métricas do dashboard admin. Puramente apresentacional:
// os números são calculados na página (DashboardPage) e passados via props.
export function DashboardStats({ ordersToday, revenueToday, ordersMonth, revenueMonth }: DashboardStatsProps) {
  const stats = [
    { label: "Pedidos hoje", value: ordersToday },
    { label: "Faturamento hoje", value: `R$ ${revenueToday.toFixed(2)}` },
    { label: "Pedidos no mês", value: ordersMonth },
    { label: "Faturamento no mês", value: `R$ ${revenueMonth.toFixed(2)}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="border rounded p-4">
          <p className="text-xs text-gray-500">{stat.label}</p>
          <p className="text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
