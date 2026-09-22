import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore";
import { customerRegisterSchema, type CustomerRegisterFormData } from "../../lib/validators";
import { fetchAddressByCep, normalizeCep, CepError } from "../../services/cepService";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const { register: registerCustomer, loading, error } = useCustomerAuthStore();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<CustomerRegisterFormData>({
    resolver: zodResolver(customerRegisterSchema),
  });

  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cep = normalizeCep(e.target.value);
    if (cep.length !== 8) return;

    setCepLoading(true);
    setCepError(null);
    try {
      const address = await fetchAddressByCep(cep);
      setValue("street", address.street, { shouldValidate: true });
      setValue("neighborhood", address.neighborhood, { shouldValidate: true });
      setValue("city", address.city, { shouldValidate: true });
      setValue("state", address.state, { shouldValidate: true });
      setFocus("number");
    } catch (e) {
      setCepError(e instanceof CepError ? e.message : "Não foi possível buscar o CEP.");
      setValue("street", "");
      setValue("neighborhood", "");
      setValue("city", "");
      setValue("state", "");
    } finally {
      setCepLoading(false);
    }
  }

  async function onSubmit(data: CustomerRegisterFormData) {
    try {
      await registerCustomer(data);
      navigate("/");
    } catch {
      // erro já fica disponível via useCustomerAuthStore().error
    }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card mt-10 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-sm text-gray-500">Cadastre-se para receber recomendações e vantagens exclusivas.</p>
        </div>

        <Input label="Nome completo" placeholder="Digite seu nome" {...register("name")} error={errors.name?.message} />
        <Input label="Telefone" type="tel" placeholder="(00) 00000-0000" {...register("phone")} error={errors.phone?.message} />
        <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} error={errors.cpf?.message} />
        <Input
          type="password"
          label="Senha"
          placeholder="Mínimo de 6 caracteres"
          {...register("password")}
          error={errors.password?.message}
        />

        <div className="border-t pt-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Endereço de entrega</h2>

          <Input
            label="CEP"
            placeholder="00000-000"
            {...register("cep", { onBlur: handleCepBlur })}
            error={errors.cep?.message ?? cepError ?? undefined}
          />
          {cepLoading && <p className="mt-1 text-xs text-gray-400">Buscando endereço...</p>}

          <div className="mt-3">
            <Input
              label="Rua / Avenida"
              placeholder="Preenchido automaticamente pelo CEP"
              readOnly
              {...register("street")}
              error={errors.street?.message}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input label="Número" placeholder="123" {...register("number")} error={errors.number?.message} />
            <Input label="Complemento" placeholder="Apto, bloco (opcional)" {...register("complement")} />
          </div>

          <div className="mt-3">
            <Input
              label="Bairro"
              placeholder="Preenchido automaticamente pelo CEP"
              readOnly
              {...register("neighborhood")}
              error={errors.neighborhood?.message}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Cidade"
                placeholder="Preenchido automaticamente pelo CEP"
                readOnly
                {...register("city")}
                error={errors.city?.message}
              />
            </div>
            <Input label="UF" placeholder="--" readOnly {...register("state")} error={errors.state?.message} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={loading || cepLoading} className="w-full">
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link to="/conta/entrar" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
