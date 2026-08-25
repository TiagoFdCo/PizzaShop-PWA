import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTenantStore } from "../store/useTenantStore";

const themeSchema = z.object({
  name: z.string().min(1, "Informe o nome da loja"),
  logoUrl: z.string().url("URL inválida"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar em formato hex #RRGGBB"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar em formato hex #RRGGBB"),
  address: z.string().min(1, "Informe o endereço"),
  openingHours: z.string().min(1, "Informe o horário de funcionamento"),
  deliveryFee: z.coerce.number().min(0, "Taxa não pode ser negativa"),
  deliveryRadiusKm: z.coerce.number().min(0, "Raio não pode ser negativo"),
  avgPrepTimeMin: z.coerce.number().min(0, "Tempo não pode ser negativo"),
});

type ThemeFormData = z.infer<typeof themeSchema>;

export function ThemeEditor() {
  const tenant = useTenantStore((state) => state.tenant);
  const saveTenant = useTenantStore((state) => state.saveTenant);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-800">Identidade da Loja</h2>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome da loja" error={errors.name?.message}>
          <input {...register("name")} className="input" />
        </Field>

        <Field label="URL do logo" error={errors.logoUrl?.message}>
          <input {...register("logoUrl")} className="input" />
        </Field>

        <Field label="Cor primária" error={errors.primaryColor?.message}>
          <div className="flex items-center gap-2">
            <input type="color" {...register("primaryColor")} className="h-9 w-12 rounded" />
            <input {...register("primaryColor")} className="input" placeholder="#FF5733" />
          </div>
        </Field>

        <Field label="Cor secundária" error={errors.secondaryColor?.message}>
          <div className="flex items-center gap-2">
            <input type="color" {...register("secondaryColor")} className="h-9 w-12 rounded" />
            <input {...register("secondaryColor")} className="input" placeholder="#1A1A1A" />
          </div>
        </Field>

        <Field label="Endereço" error={errors.address?.message}>
          <input {...register("address")} className="input" />
        </Field>

        <Field label="Horário de funcionamento" error={errors.openingHours?.message}>
          <input {...register("openingHours")} className="input" placeholder="18h às 23h" />
        </Field>

        <Field label="Taxa de entrega (R$)" error={errors.deliveryFee?.message}>
          <input type="number" step="0.01" {...register("deliveryFee")} className="input" />
        </Field>

        <Field label="Raio de entrega (km)" error={errors.deliveryRadiusKm?.message}>
          <input type="number" step="0.1" {...register("deliveryRadiusKm")} className="input" />
        </Field>

        <Field label="Tempo médio de preparo (min)" error={errors.avgPrepTimeMin?.message}>
          <input type="number" {...register("avgPrepTimeMin")} className="input" />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
