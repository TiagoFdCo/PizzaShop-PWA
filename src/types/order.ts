import type { PaymentMethod } from "./tenant";
import type { Size } from "./product";

export type OrderStatus = "recebido" | "preparo" | "saiu_para_entrega" | "entregue";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "recebido",
  "preparo",
  "saiu_para_entrega",
  "entregue",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recebido: "Pedido recebido",
  preparo: "Em preparo",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
};

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
}

// Payload para criar um pedido (id/status/createdAt são definidos pela API mock)
export type OrderInput = Omit<Order, "id" | "status" | "createdAt">;
