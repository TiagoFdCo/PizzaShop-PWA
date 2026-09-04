import { useEffect, useState } from "react";
import { Plus, Trash2, Bike, CircleDot, CheckCircle2 } from "lucide-react";
import type { Staff } from "../../types/staff";
import type { Order } from "../../types/order";
import { getDrivers, createDriver, deleteDriver } from "../../services/driverService";
import { getOrders } from "../../services/orderService";

interface AddDriverForm {
  name: string;
  username: string;
  password: string;
}

const EMPTY_FORM: AddDriverForm = { name: "", username: "", password: "" };

export function DriversManagementPage() {
  const [drivers, setDrivers] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulário de adição
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddDriverForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirmação de remoção
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [driversData, ordersData] = await Promise.all([
        getDrivers(),
        getOrders(),
      ]);
      setDrivers(driversData);
      setOrders(ordersData);
    } catch {
      setError(
        "Não foi possível carregar os dados. Verifique se a API está rodando."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /** Verifica se o entregador tem pedido ativo (em rota) */
  function isOnRoute(driverId: string): boolean {
    return orders.some(
      (o) => o.driver?.id === driverId && o.status === "saiu_para_entrega"
    );
  }

  async function handleAddDriver() {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setFormError("Preencha todos os campos.");
      return;
    }
    if (form.password.trim().length < 6) {
      setFormError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (drivers.some((d) => d.username === form.username.trim())) {
      setFormError("Já existe um entregador com esse usuário.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createDriver({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
      });
      setDrivers((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao cadastrar.";
      // Exibe a mensagem real da API (ex: "Username já em uso")
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (isOnRoute(id)) {
      setError("Não é possível remover um entregador que está em rota.");
      setDeletingId(null);
      return;
    }
    try {
      await deleteDriver(id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível remover o entregador."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Entregadores</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setForm(EMPTY_FORM);
            setFormError(null);
          }}
          className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} />
          Adicionar entregador
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Gerencie os entregadores e acompanhe quem está em rota.
      </p>

      {/* Formulário de adição */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Novo entregador
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nome completo
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="ex: Marcos Oliveira"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Usuário (login)
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    username: e.target.value.toLowerCase().replace(/\s/g, ""),
                  }))
                }
                placeholder="ex: marcos"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="mín. 6 caracteres"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddDriver}
              disabled={saving}
              className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erro */}
      {!loading && error && (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={load}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Lista vazia */}
      {!loading && !error && drivers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="bg-gray-100 rounded-full p-5">
            <Bike size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            Nenhum entregador cadastrado ainda.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-primary text-sm hover:underline"
          >
            Adicionar o primeiro
          </button>
        </div>
      )}

      {/* Tabela de entregadores */}
      {!loading && !error && drivers.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">Situação</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((driver) => {
                const onRoute = isOnRoute(driver.id);
                return (
                  <tr
                    key={driver.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {driver.name}
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {driver.username}
                    </td>
                    <td className="px-5 py-3">
                      {onRoute ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          <CircleDot size={11} className="text-amber-500" />
                          Em rota
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500"
                          />
                          Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {deletingId === driver.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">
                            Confirmar?
                          </span>
                          <button
                            onClick={() => handleDelete(driver.id)}
                            className="text-xs text-red-600 font-medium hover:underline"
                          >
                            Sim, remover
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(driver.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                          title="Remover entregador"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
