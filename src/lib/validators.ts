import { z } from "zod";

// --- Admin: login ---
export const loginSchema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// --- Admin: customização da loja (tenantConfig) ---
export const themeSchema = z.object({
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
export type ThemeFormData = z.infer<typeof themeSchema>;

// --- Admin: cadastro/edição de pizza ---
export const productSchema = z.object({
  name: z.string().min(1, "Informe o nome da pizza"),
  description: z.string().min(1, "Informe a descrição"),
  imageUrl: z.string().url("URL de imagem inválida"),
  basePrice: z.coerce.number().positive("Preço deve ser maior que zero"),
  category: z.string().min(1, "Informe a categoria"),
  availableSizes: z.array(z.enum(["P", "M", "G"])).min(1, "Selecione ao menos um tamanho"),
});
export type ProductFormData = z.infer<typeof productSchema>;

// --- Loja: checkout ---
export const checkoutSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo"),
  address: z.string().min(5, "Informe um endereço válido"),
  phone: z
    .string()
    .min(8, "Informe um telefone válido")
    .regex(/^[0-9()\-\s+]+$/, "Use apenas números e símbolos de telefone"),
  paymentMethod: z.enum(["pix", "cartao", "dinheiro"], {
    message: "Selecione uma forma de pagamento",
  }),
});
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
