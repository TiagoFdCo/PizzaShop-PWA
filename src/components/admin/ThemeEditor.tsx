import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTenantStore } from "../../store/useTenantStore";
import { themeSchema, type ThemeFormData } from "../../lib/validators";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ThemeEditor() {
  const tenant = useTenantStore((state) => state.tenant);
  const saveTenant = useTenantStore((state) => state.saveTenant);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
  });

  useEffect(() => {
    if (tenant) reset(tenant);
  }, [tenant, reset]);

  async function onSubmit(data: ThemeFormData) {
    if (!tenant) return;
    await saveTenant({ ...tenant, ...data });
  }

  if (!tenant) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Identidade da Loja</h2>
      <p className="text-sm text-gray-500">
        Alterações aqui refletem em tempo real na loja — este é o `tenantConfig`, a fonte única de
        verdade do white-label.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome da loja" {...register("name")} error={errors.name?.message} />
        <Input label="URL do logo" {...register("logoUrl")} error={errors.logoUrl?.message} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cor primária</label>
          <div className="flex items-center gap-2">
            <input type="color" {...register("primaryColor")} className="h-9 w-12 rounded border" />
            <input {...register("primaryColor")} className="input" placeholder="#C0392B" />
          </div>
          {errors.primaryColor && <p className="mt-1 text-xs text-red-500">{errors.primaryColor.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cor secundária</label>
          <div className="flex items-center gap-2">
            <input type="color" {...register("secondaryColor")} className="h-9 w-12 rounded border" />
            <input {...register("secondaryColor")} className="input" placeholder="#272B33" />
          </div>
          {errors.secondaryColor && <p className="mt-1 text-xs text-red-500">{errors.secondaryColor.message}</p>}
        </div>

        <Input label="Endereço" {...register("address")} error={errors.address?.message} />
        <Input
          label="Horário de funcionamento"
          {...register("openingHours")}
          placeholder="18h às 23h"
          error={errors.openingHours?.message}
        />
        <Input
          type="number"
          step="0.01"
          label="Taxa de entrega (R$)"
          {...register("deliveryFee")}
          error={errors.deliveryFee?.message}
        />
        <Input
          type="number"
          step="0.1"
          label="Raio de entrega (km)"
          {...register("deliveryRadiusKm")}
          error={errors.deliveryRadiusKm?.message}
        />
        <Input
          type="number"
          label="Tempo médio de preparo (min)"
          {...register("avgPrepTimeMin")}
          error={errors.avgPrepTimeMin?.message}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
