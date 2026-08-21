import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData } from "../../lib/validators";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  submitLabel?: string;
}

// Formulário de criação/edição de pizza. Usado tanto para "Nova pizza"
// quanto para "Editar" (o MenuManagementPage decide qual caso é via defaultValues).
export function ProductForm({ defaultValues, onSubmit, submitLabel = "Salvar" }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm mb-1">Nome</label>
        <input id="name" {...register("name")} className="w-full border rounded px-3 py-2" />
        {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm mb-1">Descrição</label>
        <textarea id="description" {...register("description")} className="w-full border rounded px-3 py-2" />
        {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm mb-1">Categoria</label>
        <input id="category" {...register("category")} className="w-full border rounded px-3 py-2" />
        {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category.message}</p>}
      </div>

      <div>
        <label htmlFor="basePrice" className="block text-sm mb-1">Preço base</label>
        <input
          id="basePrice"
          type="number"
          step="0.01"
          {...register("basePrice", { valueAsNumber: true })}
          className="w-full border rounded px-3 py-2"
        />
        {errors.basePrice && <p className="text-red-600 text-xs mt-1">{errors.basePrice.message}</p>}
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm mb-1">URL da imagem</label>
        <input id="imageUrl" {...register("imageUrl")} className="w-full border rounded px-3 py-2" />
        {errors.imageUrl && <p className="text-red-600 text-xs mt-1">{errors.imageUrl.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("active")} />
        Ativo no cardápio
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 rounded bg-[var(--color-primary)] text-white disabled:opacity-50"
      >
        {isSubmitting ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
