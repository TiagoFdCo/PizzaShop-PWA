import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTenantStore } from "../../store/useTenantStore";
import { themeSchema, type ThemeFormData } from "../../lib/validators";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { FormSection } from "./customization/FormSection";
import { ImageUploadField } from "./customization/ImageUploadField";

export function ThemeEditor() {
  const tenant = useTenantStore((state) => state.tenant);
  const saveTenant = useTenantStore((state) => state.saveTenant);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema) as Resolver<ThemeFormData>,
  });

  useEffect(() => {
    if (tenant) reset(tenant);
  }, [tenant, reset]);

  async function onSubmit(data: ThemeFormData) {
    if (!tenant) return;
    setFeedback(null);
    try {
      await saveTenant({ ...tenant, ...data });
      setFeedback({ type: "success", message: "Alterações salvas com sucesso." });
    } catch (e) {
      setFeedback({
        type: "error",
        message: e instanceof Error ? e.message : "Não foi possível salvar as alterações.",
      });
    }
  }

  if (!tenant) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-gray-500">
        Todas as alterações abaixo refletem em tempo real na loja — juntas, elas formam o{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">tenantConfig</code>, a fonte
        única de verdade do white-label.
      </p>

      <FormSection title="Identidade da loja" description="Nome, frase de efeito e imagens da marca.">
        <Input label="Nome da loja" {...register("name")} error={errors.name?.message} />
        <Input
          label="Frase de efeito (tagline)"
          placeholder="Pizza artesanal, feita com carinho"
          {...register("tagline")}
          error={errors.tagline?.message}
        />

        <Controller
          name="logoUrl"
          control={control}
          render={({ field }) => (
            <ImageUploadField
              label="Logo"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.logoUrl?.message}
              previewClassName="aspect-square w-24"
              helperText="PNG ou SVG com fundo transparente funciona melhor. Máx. 2MB."
            />
          )}
        />

        <Controller
          name="bannerUrl"
          control={control}
          render={({ field }) => (
            <ImageUploadField
              label="Banner da página inicial (opcional)"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.bannerUrl?.message}
              previewClassName="aspect-video w-40"
              helperText="Aparece no topo da landing page, atrás do título. Máx. 2MB."
            />
          )}
        />

        <div className="sm:col-span-2">
          <Textarea
            label="Sobre a loja"
            rows={3}
            placeholder="Conte um pouco sobre a pizzaria: história, diferenciais, forno a lenha etc."
            {...register("aboutText")}
            error={errors.aboutText?.message}
          />
        </div>
      </FormSection>

      <FormSection title="Cores da marca" description="Aplicadas em botões, links e destaques em toda a loja.">
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
      </FormSection>

      <FormSection
        title="Contato e localização"
        description="Exibidos no rodapé e na página inicial."
      >
        <Input label="Endereço" {...register("address")} error={errors.address?.message} />
        <Input
          label="Horário de funcionamento"
          {...register("openingHours")}
          placeholder="18h às 23h"
          error={errors.openingHours?.message}
        />
        <Input
          label="WhatsApp"
          {...register("whatsapp")}
          placeholder="(00) 00000-0000"
          error={errors.whatsapp?.message}
        />
        <Input
          label="Instagram"
          {...register("instagram")}
          placeholder="@suapizzaria"
          error={errors.instagram?.message}
        />
      </FormSection>

      <FormSection
        title="Operação"
        description="Regras de entrega e pedido mínimo usadas no carrinho e no checkout."
      >
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
        <Input
          type="number"
          step="0.01"
          label="Pedido mínimo (R$)"
          placeholder="0 = sem mínimo"
          {...register("minOrderValue")}
          error={errors.minOrderValue?.message}
        />
      </FormSection>

      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {feedback.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}