export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export interface TenantConfig {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  openingHours: string;
  deliveryFee: number;
  deliveryRadiusKm: number;
  avgPrepTimeMin: number;
  enabledPaymentMethods: PaymentMethod[];
}
