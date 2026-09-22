// Fase 4 (P3) — formulário de novo cupom (painel admin)
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { couponFormSchema, type CouponFormData } from "../../../lib/couponForm";

interface CouponFormProps {
  onSubmit: (data: CouponFormData) => Promise<void>;
  onCancel: () => void;
  serverError?: string | null;
}

export function CouponForm({ onSubmit, onCancel, serverError }: CouponFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentual",
      value: "",
      minOrderValue: "",
      validFrom: "",
      validUntil: "",
      maxUses: "",
    },
  });
  const discountType = useWatch({ control, name: "discountType" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        id="coupon-form-code"
        label="Código"
        placeholder="Ex.: PIZZA10"
        className="w-full uppercase"
        {...register("code")}
        error={errors.code?.message}
      />
      <Input
        id="coupon-form-description"
        label="Descrição (aparece para o cliente)"
        placeholder="Ex.: 10% na primeira compra"
        className="w-full"
        {...register("description")}
        error={errors.description?.message}
      />

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-gray-700">Tipo de desconto</legend>
        <div className="flex gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input type="radio" value="percentual" {...register("discountType")} className="h-4 w-4 accent-primary" />
            Porcentagem (%)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="valor_fixo" {...register("discountType")} className="h-4 w-4 accent-primary" />
            Valor fixo (R$)
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="coupon-form-value"
          label={discountType === "percentual" ? "Desconto (%)" : "Desconto (R$)"}
          inputMode="decimal"
          placeholder={discountType === "percentual" ? "10" : "15,00"}
          className="w-full"
        {...register("value")}
          error={errors.value?.message}
        />
        <Input
          id="coupon-form-min"
          label="Pedido mínimo (R$)"
          inputMode="decimal"
          placeholder="Opcional"
          className="w-full"
        {...register("minOrderValue")}
          error={errors.minOrderValue?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="coupon-form-from"
          type="datetime-local"
          label="Válido a partir de"
          className="w-full"
        {...register("validFrom")}
          error={errors.validFrom?.message}
        />
        <Input
          id="coupon-form-until"
          type="datetime-local"
          label="Válido até"
          className="w-full"
        {...register("validUntil")}
          error={errors.validUntil?.message}
        />
      </div>
      <p className="-mt-2 text-xs text-gray-500">Em branco: começa agora e não expira.</p>

      <Input
        id="coupon-form-max"
        label="Limite de usos"
        inputMode="numeric"
        placeholder="Em branco = ilimitado"
        className="w-full"
        {...register("maxUses")}
        error={errors.maxUses?.message}
      />

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar cupom"}
        </Button>
      </div>
    </form>
  );
}
