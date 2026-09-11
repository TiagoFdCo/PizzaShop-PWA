import { useMemo, useState, type ReactNode, type FormEvent } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarDays,
  FileText,
  FileSpreadsheet,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFetch } from "../../hooks/useFetch";
import { getOrders } from "../../services/orderService";
import { createExpense, deleteExpense, getExpenses } from "../../services/financeService";
import { downloadReportPdf, downloadReportXlsx } from "../../services/reportService";
import { formatCurrency } from "../../lib/formatCurrency";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import type { Expense, ExpenseCategory } from "../../types/finance";
import { EXPENSE_CATEGORY_LABELS } from "../../types/finance";
import type { Order } from "../../types/order";

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];

// Cores fixas (não usam a cor customizável do tenant — gráfico precisa de
// valor concreto, não de var(--color-primary)).
const COLOR_RECEITA = "#16A34A";   // verde — entrada
const COLOR_DESPESA = "#DC2626";   // vermelho — saída
const COLOR_DELIVERY = "#C0392B";  // vermelho da marca
const COLOR_PRESENCIAL = "#2563EB"; // azul

function monthKey(date: string) {
  return date.slice(0, 7);
}

function downloadCsv(orders: Order[], expenses: Expense[]) {
  const rows = [
    ["Tipo", "Descrição", "Data", "Forma", "Categoria", "Valor"],
    ...orders.map((order) => [
      "Entrada",
      `Pedido #${order.id}`,
      order.createdAt,
      order.paymentMethod,
      "Venda",
      order.total.toFixed(2),
    ]),
    ...expenses.map((expense) => [
      "Saída",
      expense.description,
      expense.date,
      "",
      EXPENSE_CATEGORY_LABELS[expense.category],
      (-expense.amount).toFixed(2),
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).split('"').join('""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fluxo-financeiro-bella-napoli.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function BiDashboardPage() {
  const { data: orders, loading: ordersLoading, error: ordersError } = useFetch(getOrders, []);
  const { data: expenses, loading: expensesLoading } = useFetch(getExpenses, []);
  const [localExpenses, setLocalExpenses] = useState<Expense[] | null>(null);
  const [period, setPeriod] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [form, setForm] = useState({
    description: "",
    category: "ingredientes" as ExpenseCategory,
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const listOrders = orders ?? [];
  const listExpenses = localExpenses ?? expenses ?? [];

  const filtered = useMemo(() => {
    if (period === "todos") return { orders: listOrders, expenses: listExpenses };
    return {
      orders: listOrders.filter((order) => monthKey(order.createdAt) === period),
      expenses: listExpenses.filter((expense) => monthKey(expense.date) === period),
    };
  }, [listOrders, listExpenses, period]);

  const revenue = filtered.orders
    .filter((order) => order.status === "entregue")
    .reduce((sum, order) => sum + order.total, 0);
  const expensesTotal = filtered.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = revenue - expensesTotal;
  const deliveredCount = filtered.orders.filter((o) => o.status === "entregue").length;
  const averageTicket = deliveredCount ? revenue / deliveredCount : 0;
  const ratings = filtered.orders.filter((o) => o.rating !== null).map((o) => o.rating as number);
  const averageRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  const periods = useMemo(() => {
    const keys = new Set<string>();
    listOrders.forEach((order) => keys.add(monthKey(order.createdAt)));
    listExpenses.forEach((expense) => keys.add(monthKey(expense.date)));
    return [...keys].sort().reverse();
  }, [listOrders, listExpenses]);

  // Gráfico 1: receita x despesas por mês (últimos 6 meses com movimento —
  // independe do filtro de período, pra dar contexto de tendência).
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; receita: number; despesas: number }>();
    listOrders
      .filter((o) => o.status === "entregue")
      .forEach((o) => {
        const key = monthKey(o.createdAt);
        const entry = map.get(key) ?? { month: key, receita: 0, despesas: 0 };
        entry.receita += o.total;
        map.set(key, entry);
      });
    listExpenses.forEach((e) => {
      const key = monthKey(e.date);
      const entry = map.get(key) ?? { month: key, receita: 0, despesas: 0 };
      entry.despesas += e.amount;
      map.set(key, entry);
    });
    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((m) => ({
        ...m,
        label: new Date(`${m.month}-02T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      }));
  }, [listOrders, listExpenses]);

  // Gráfico 2: vendas por canal (delivery x presencial), respeitando o período selecionado.
  const channelData = useMemo(() => {
    const delivered = filtered.orders.filter((o) => o.status === "entregue");
    const delivery = delivered.filter((o) => o.channel === "delivery").reduce((sum, o) => sum + o.total, 0);
    const dineIn = delivered.filter((o) => o.channel === "dine_in").reduce((sum, o) => sum + o.total, 0);
    return [
      { name: "Delivery", value: delivery, color: COLOR_DELIVERY },
      { name: "Presencial", value: dineIn, color: COLOR_PRESENCIAL },
    ].filter((d) => d.value > 0);
  }, [filtered.orders]);

  async function handleAddExpense(event: FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount.replace(",", "."));
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      window.alert("Informe uma descrição e um valor válido.");
      return;
    }
    setSaving(true);
    try {
      const created = await createExpense({
        description: form.description.trim(),
        category: form.category,
        amount,
        date: form.date,
        notes: form.notes.trim() || undefined,
      });
      setLocalExpenses([created, ...listExpenses]);
      setModalOpen(false);
      setForm({ description: "", category: "ingredientes", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!window.confirm("Excluir esta despesa?")) return;
    await deleteExpense(id);
    setLocalExpenses(listExpenses.filter((expense) => expense.id !== id));
  }

  async function handleExcel() {
    setDownloadingXlsx(true);
    try {
      await downloadReportXlsx();
    } catch {
      downloadCsv(filtered.orders, filtered.expenses);
    } finally {
      setDownloadingXlsx(false);
    }
  }

  async function handlePdf() {
    setDownloadingPdf(true);
    try {
      await downloadReportPdf();
    } catch (err) {
      // Corrigido: antes mostrava sempre a mesma mensagem genérica ("falta
      // reportlab"), mesmo quando o erro real era outro (token expirado,
      // rede fora do ar, CORS). Agora mostra a mensagem real do erro.
      const message = err instanceof Error ? err.message : "Erro desconhecido ao gerar o PDF.";
      window.alert(`Não foi possível gerar o PDF.\n\n${message}`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Gestão financeira</p>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe vendas, despesas e o resultado da pizzaria.</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input min-w-36" aria-label="Período">
            <option value="todos">Todo o período</option>
            {periods.map((value) => (
              <option key={value} value={value}>{new Date(`${value}-02T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</option>
            ))}
          </select>
          <button onClick={handleExcel} disabled={downloadingXlsx} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
            <FileSpreadsheet size={16} /> {downloadingXlsx ? "Gerando..." : "Excel"}
          </button>
          <button onClick={handlePdf} disabled={downloadingPdf} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
            <FileText size={16} /> {downloadingPdf ? "Gerando..." : "PDF"}
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
            <Plus size={16} /> Nova despesa
          </button>
        </div>
      </div>

      {(ordersLoading || expensesLoading) && <Spinner label="Carregando financeiro..." />}
      {ordersError && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Não foi possível carregar os pedidos. As despesas continuam disponíveis.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<ArrowUpCircle />} label="Entradas" value={formatCurrency(revenue)} detail="Pedidos entregues" />
        <Kpi icon={<ArrowDownCircle />} label="Despesas" value={formatCurrency(expensesTotal)} detail={`${filtered.expenses.length} lançamento(s)`} />
        <Kpi icon={<WalletCards />} label="Saldo líquido" value={formatCurrency(balance)} detail={balance >= 0 ? "Resultado positivo" : "Atenção ao caixa"} positive={balance >= 0} />
        <Kpi icon={<ShoppingBag />} label="Ticket médio" value={formatCurrency(averageTicket)} detail={`${deliveredCount} venda(s)`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-semibold text-gray-900">Receita x despesas por mês</h2><p className="text-sm text-gray-500">Últimos meses com movimento (independe do filtro de período)</p></div>
            <BarChart3 className="text-primary" size={22} />
          </div>
          {monthlyData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(Number(v))} width={90} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill={COLOR_RECEITA} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill={COLOR_DESPESA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-400">Sem dados suficientes pra montar o gráfico ainda.</p>
          )}
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-semibold text-gray-900">Vendas por canal</h2><p className="text-sm text-gray-500">Delivery x presencial, no período</p></div>
          </div>
          {channelData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {channelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-400">Nenhuma venda entregue neste período.</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-semibold text-gray-900">Fluxo de caixa</h2><p className="text-sm text-gray-500">Movimentações do período selecionado</p></div>
            <TrendingUp className="text-primary" size={22} />
          </div>
          <div className="space-y-3">
            {[
              ...filtered.orders.filter((o) => o.status === "entregue").map((o) => ({ id: `o-${o.id}`, date: o.createdAt, description: `Pedido #${o.id}`, category: "Venda", amount: o.total, type: "in" as const })),
              ...filtered.expenses.map((e) => ({ id: `e-${e.id}`, date: e.date, description: e.description, category: EXPENSE_CATEGORY_LABELS[e.category], amount: e.amount, type: "out" as const })),
            ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`rounded-full p-2 ${item.type === "in" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {item.type === "in" ? <ArrowUpCircle size={17} /> : <ArrowDownCircle size={17} />}
                  </span>
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{item.description}</p><p className="text-xs text-gray-400">{item.category} · {new Date(item.date).toLocaleDateString("pt-BR")}</p></div>
                </div>
                <strong className={item.type === "in" ? "text-green-600" : "text-red-600"}>{item.type === "in" ? "+" : "-"}{formatCurrency(item.amount)}</strong>
              </div>
            ))}
            {!filtered.orders.length && !filtered.expenses.length && <p className="py-10 text-center text-sm text-gray-400">Nenhuma movimentação encontrada.</p>}
          </div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-gray-900">Indicadores</h2><p className="text-sm text-gray-500">Saúde das vendas</p></div><Star className="text-amber-500" size={22} /></div>
          <div className="space-y-5">
            <Metric label="Avaliação média" value={averageRating === null ? "—" : `${averageRating.toFixed(1)} / 5`} />
            <Metric label="Margem após despesas" value={revenue ? `${((balance / revenue) * 100).toFixed(1)}%` : "—"} />
            <Metric label="Pedidos entregues" value={String(filtered.orders.filter((o) => o.status === "entregue").length)} />
            <Metric label="Custo com despesas" value={formatCurrency(expensesTotal)} />
          </div>
        </section>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-gray-900">Despesas cadastradas</h2><p className="text-sm text-gray-500">Controle os custos que saem do caixa.</p></div><CalendarDays size={20} className="text-gray-400" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400"><th className="pb-3">Data</th><th className="pb-3">Descrição</th><th className="pb-3">Categoria</th><th className="pb-3 text-right">Valor</th><th className="pb-3 text-right">Ação</th></tr></thead>
            <tbody>{filtered.expenses.map((expense) => <tr key={expense.id} className="border-b border-gray-50"><td className="py-3 text-gray-500">{new Date(expense.date).toLocaleDateString("pt-BR")}</td><td className="py-3 font-medium text-gray-800">{expense.description}</td><td className="py-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{EXPENSE_CATEGORY_LABELS[expense.category]}</span></td><td className="py-3 text-right font-semibold text-red-600">-{formatCurrency(expense.amount)}</td><td className="py-3 text-right"><button onClick={() => handleDeleteExpense(expense.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${expense.description}`}><Trash2 size={16} /></button></td></tr>)}</tbody>
          </table>
          {!filtered.expenses.length && <p className="py-8 text-center text-sm text-gray-400">Nenhuma despesa cadastrada neste período.</p>}
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cadastrar despesa">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input id="expense-description" label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Compra de mussarela" />
          <div className="grid grid-cols-2 gap-3">
            <Input id="expense-amount" label="Valor (R$)" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            <Input id="expense-date" label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div><label htmlFor="expense-category" className="mb-1 block text-sm font-medium text-gray-700">Categoria</label><select id="expense-category" className="input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label htmlFor="expense-notes" className="mb-1 block text-sm font-medium text-gray-700">Observação (opcional)</label><textarea id="expense-notes" className="input min-h-20 w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes do lançamento..." /></div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Cadastrar despesa"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function Kpi({ icon, label, value, detail, positive }: { icon: ReactNode; label: string; value: string; detail: string; positive?: boolean }) {
  return <div className="card"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-gray-500">{label}</span><span className={positive === false ? "text-red-500" : "text-primary"}>{icon}</span></div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-gray-100 pb-3"><span className="text-sm text-gray-500">{label}</span><strong className="text-gray-900">{value}</strong></div>;
}
