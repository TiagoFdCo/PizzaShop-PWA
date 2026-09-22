import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore";
import { customerLoginSchema, type CustomerLoginFormData } from "../../lib/validators";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useCustomerAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerLoginFormData>({
    resolver: zodResolver(customerLoginSchema),
  });

  async function onSubmit(data: CustomerLoginFormData) {
    try {
      await login(data);
      navigate("/");
    } catch {
      // erro já fica disponível via useCustomerAuthStore().error
    }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card mt-10 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entrar</h1>
          <p className="text-sm text-gray-500">Acesse sua conta para acompanhar pedidos e vantagens.</p>
        </div>

        <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} error={errors.cpf?.message} />
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

        <p className="text-center text-sm text-gray-500">
          Ainda não tem conta?{" "}
          <Link to="/conta/cadastro" className="text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
