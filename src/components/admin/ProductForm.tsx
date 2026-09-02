import { useEffect } from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData } from "../../lib/validators";
import type { Pizza, Size } from "../../types/product";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ImageUploadField } from "./customization/ImageUploadField";

const ALL_SIZES: Size[] = ["P", "M", "G"];

interface ProductFormProps {
  initialData?: Pizza | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: { availableSizes: ["M"] },
  });

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData });
    } else {
      reset({
        name: "",
        description: "",
        imageUrl: "",
        basePrice: 0,
        category: "salgada",
        availableSizes: ["M"],
      });
    }
  }, [initialData, reset]);

  const selectedSizes = useWatch({ control, name: "availableSizes" }) ?? [];

  function toggleSize(size: Size) {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setValue("availableSizes", next, { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("name")} error={errors.name?.message} />
      <Input label="Descrição" {...register("description")} error={errors.description?.message} />

      <Controller
        name="imageUrl"
        control={control}
        render={({ field }) => (
          <ImageUploadField
            label="Foto da pizza"
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.imageUrl?.message}
            previewClassName="aspect-video w-32"
            helperText="Foto quadrada ou 4:3 funciona melhor. Máx. 2MB."
          />
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          step="0.01"
          label="Preço base (R$)"
          {...register("basePrice")}
          error={errors.basePrice?.message}
        />
        <Input label="Categoria" placeholder="salgada, doce..." {...register("category")} error={errors.category?.message} />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">Tamanhos disponíveis</span>
        <div className="flex gap-2">
          {ALL_SIZES.map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => toggleSize(size)}
              className={`h-9 w-9 rounded-full border text-sm font-semibold transition ${
                selectedSizes.includes(size) ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-600"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {errors.availableSizes && <p className="mt-1 text-xs text-red-500">{errors.availableSizes.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar pizza"}
        </Button>
      </div>
    </form>
  );
}