import { useState } from "react";
import { Bike } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export function DriverLoginPage() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login({ username, password });
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-4 text-primary">
          <Bike size={30} />
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Portal do Entregador</h1>
        <p className="text-sm text-gray-400">entrega / entrega123</p>
      </div>

      <div className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <Input
          label="Usuário"
          placeholder="seu.usuario"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleLogin}
          disabled={loading || !username || !password}
          className="w-full"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>
    </div>
  );
}
