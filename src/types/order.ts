import type { PaymentMethod } from "./tenant";
import type { Size } from "./product";

export type OrderStatus =
  | "recebido"
  | "preparo"
  | "pronto_entrega"
  | "saiu_para_entrega"
  | "entregue"
  | "falha_entrega";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "recebido",
  "preparo",
  "pronto_entrega",
  "saiu_para_entrega",
  "entregue",
];
// falha_entrega fica FORA do flow linear — é um desvio a partir de
// "saiu_para_entrega", não um próximo passo. Tratado à parte na UI.

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recebido: "Pedido recebido",
  preparo: "Em preparo",
  pronto_entrega: "Pronto para entrega",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  falha_entrega: "Falha na entrega",
};

export type DeliveryFailureReason =
  | "cliente_ausente"
  | "endereco_nao_encontrado"
  | "cliente_recusou"
  | "problema_veiculo"
  | "outro";

export const DELIVERY_FAILURE_REASON_LABELS: Record<DeliveryFailureReason, string> = {
  cliente_ausente: "Cliente ausente no endereço",
  endereco_nao_encontrado: "Endereço não encontrado",
  cliente_recusou: "Cliente recusou o pedido",
  problema_veiculo: "Problema com o veículo",
  outro: "Outro motivo",
};

export interface DeliveryFailure {
  reason: DeliveryFailureReason;
  description?: string;
  reportedAt: string;
}

// Referência leve embutida no pedido (evita 1 fetch extra por pedido nas telas)
export interface OrderStaffRef {
  id: string;
  name: string;
}

// Um item dentro do carrinho/pedido: uma pizza já customizada (tamanho + adicionais)
export interface CartItem {
  cartItemId: string; // identifica a combinação (produto+tamanho+adicionais) como linha única no carrinho
  productId: string;
  name: string;
  imageUrl: string;
  size: Size;
  toppings: { id: string; name: string; price: number }[];
  unitPrice: number; // basePrice + soma dos adicionais
  quantity: number;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;

  cook: OrderStaffRef | null;
  driver: OrderStaffRef | null;
  deliveryFailure?: DeliveryFailure;
}

// Payload para criar um pedido (id/status/createdAt são definidos pela API mock)
export type OrderInput = Omit<Order, "id" | "status" | "createdAt" | "cook" | "driver" | "deliveryFailure">;
