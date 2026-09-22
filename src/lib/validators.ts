import { z } from "zod";
import { normalizeCep } from "../services/cepService";

// --- Cliente (Fase 4, P1): validação de CPF (algoritmo mod 11, mesmo do backend) ---
function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  const digits = normalizeCpf(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  for (const checkIndex of [9, 10]) {
    let total = 0;
    for (let i = 0; i < checkIndex; i++) {
      total += Number(digits[i]) * (checkIndex + 1 - i);
    }
    const expected = ((total * 10) % 11) % 10;
    if (expected !== Number(digits[checkIndex])) return false;
  }

  return true;
}

const cpfSchema = z.string().refine(isValidCpf, "CPF inválido");

// --- Cliente: login/cadastro ---
export const customerRegisterSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo"),
  phone: z
    .string()
    .min(8, "Informe um telefone válido")
    .regex(/^[0-9()\-\s+]+$/, "Use apenas números e símbolos de telefone"),
  cpf: cpfSchema,
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  cep: z
    .string()
    .transform(normalizeCep)
    .refine((v) => v.length === 8, "CEP deve ter 8 dígitos"),
  street: z.string().min(1, "Busque o CEP para preencher a rua"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Busque o CEP para preencher o bairro"),
  city: z.string().min(1, "Busque o CEP para preencher a cidade"),
  state: z.string().length(2, "Busque o CEP para preencher a UF"),
});
export type CustomerRegisterFormData = z.infer<typeof customerRegisterSchema>;

export const customerLoginSchema = z.object({
  cpf: cpfSchema,
  password: z.string().min(1, "Informe a senha"),
});
export type CustomerLoginFormData = z.infer<typeof customerLoginSchema>;

// --- Admin: login ---
export const loginSchema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// --- Admin: customização da loja (tenantConfig) ---
const imageSchema = z
  .string()
  .min(1, "Envie uma imagem ou informe uma URL")
  .refine(
    (value) => value.startsWith("data:image/") || /^https?:\/\/.+/.test(value),
    "Envie um arquivo de imagem ou informe uma URL http(s) válida"
  );

export const themeSchema = z.object({
  name: z.string().min(1, "Informe o nome da loja"),
  tagline: z.string().max(120, "Máximo de 120 caracteres"),
  aboutText: z.string().max(600, "Máximo de 600 caracteres"),
  logoUrl: imageSchema,
  bannerUrl: z.string(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar em formato hex #RRGGBB"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar em formato hex #RRGGBB"),
  address: z.string().min(1, "Informe o endereço"),
  openingHours: z.string().min(1, "Informe o horário de funcionamento"),
  whatsapp: z.string(),
  instagram: z.string(),
  deliveryFee: z.coerce.number().min(0, "Taxa não pode ser negativa"),
  deliveryRadiusKm: z.coerce.number().min(0, "Raio não pode ser negativo"),
  avgPrepTimeMin: z.coerce.number().min(0, "Tempo não pode ser negativo"),
  minOrderValue: z.coerce.number().min(0, "Valor mínimo não pode ser negativo"),
});
export type ThemeFormData = z.infer<typeof themeSchema>;

// --- Admin: cadastro/edição de pizza ---
export const productSchema = z.object({
  name: z.string().min(1, "Informe o nome da pizza"),
  description: z.string().min(1, "Informe a descrição"),
  imageUrl: imageSchema,
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