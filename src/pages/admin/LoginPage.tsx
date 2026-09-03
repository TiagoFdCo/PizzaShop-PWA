import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { loginSchema, type LoginFormData } from "../../lib/validators";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
  try {
    await login(data);
    const role = useAuthStore.getState().session?.staff.role;
    if (role === "cozinha") navigate("/cozinha");
    else if (role === "entrega") navigate("/entrega");
    else navigate("/admin/dashboard");
  } catch {
    // erro já fica disponível via useAuthStore().error
  }
}

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-card">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Painel Admin</h1>
          <p className="text-sm text-gray-400">admin / admin123</p>
        </div>

        <Input label="Usuário" placeholder="admin" {...register("username")} error={errors.username?.message} />
        <Input
          type="password"
          label="Senha"
          placeholder="••••••••"
          {...register("password")}
          error={errors.password?.message}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
