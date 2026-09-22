import type { PaymentMethod } from "./tenant";

export type PaymentStatus = "pendente" | "aprovado" | "recusado";

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  /** Só vem preenchido logo após criar/reiniciar o pagamento via Mercado Pago. */
  initPoint?: string | null;
}
