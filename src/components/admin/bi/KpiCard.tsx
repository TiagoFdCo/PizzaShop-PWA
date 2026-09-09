/**
 * KpiCard — card de indicador-chave de desempenho para o painel BI.
 * Segue o mesmo visual de `.card` + classes Tailwind já usadas em DashboardStats.
 */

interface KpiCardProps {
  label: string;
  value: string | number;
  /** Ícone Lucide (passado como elemento JSX) */
  icon?: React.ReactNode;
  /** Destaque visual: "green" para positivo, "red" para negativo, undefined = cinza */
  variant?: "green" | "red" | "neutral";
}

const variantClasses: Record<NonNullable<KpiCardProps["variant"]>, string> = {
  green:   "text-green-600",
  red:     "text-red-600",
  neutral: "text-gray-900",
};

export function KpiCard({ label, value, icon, variant = "neutral" }: KpiCardProps) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${variantClasses[variant]}`}>
        {value}
      </p>
    </div>
  );
}
