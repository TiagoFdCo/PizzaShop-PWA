import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const loginSchema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
      navigate("/admin/dashboard");
    } catch {
      // erro já fica disponível via useAuthStore().error
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-gray-800">Painel Admin</h1>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Usuário</label>
          <input
            {...register("username")}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
            placeholder="admin"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            {...register("password")}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[rgb(var(--color-primary))] py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
