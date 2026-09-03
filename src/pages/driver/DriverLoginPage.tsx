import { useState } from "react";
import { Bike } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { loginDriver } from "../../services/driverService";

export function DriverLoginPage() {
  const setDriverSession = useAuthStore((s) => s.setDriverSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      const driver = await loginDriver(username, password);
      if (!driver) {
        setError("Usuário ou senha inválidos.");
      } else {
        setDriverSession(driver.id, driver.name);
      }
    } catch {
      setError("Não foi possível conectar à API. Verifique se ela está rodando.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="bg-orange-500 rounded-2xl p-4 shadow-lg shadow-orange-500/20">
          <Bike size={32} className="text-white" />
        </div>
        <h1 className="text-zinc-100 font-bold text-xl tracking-tight">
          Portal do Entregador
        </h1>
        <p className="text-zinc-500 text-sm">Entre com suas credenciais</p>
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            Usuário
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="seu.usuario"
            autoCapitalize="none"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 text-sm placeholder-zinc-600 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 text-sm placeholder-zinc-600 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/60 border border-red-800/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !username || !password}
          className="mt-1 bg-orange-500 hover:bg-orange-400 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-all"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
