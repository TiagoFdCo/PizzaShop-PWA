export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export interface TenantConfig {
  id: string;
  name: string;
  tagline: string;
  aboutText: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  openingHours: string;
  whatsapp: string;
  instagram: string;
  deliveryFee: number;
  deliveryRadiusKm: number;
  avgPrepTimeMin: number;
  minOrderValue: number;
  enabledPaymentMethods: PaymentMethod[];
}