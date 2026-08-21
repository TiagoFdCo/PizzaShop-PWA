import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  description: z.string().min(10, "Descrição muito curta"),
  category: z.string().min(1, "Selecione uma categoria"),
  basePrice: z.number().positive("Preço deve ser maior que zero"),
  imageUrl: z.string().url("URL de imagem inválida"),
  active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;
