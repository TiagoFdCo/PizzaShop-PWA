import type { PaymentMethod } from "./tenant";
import type { Size } from "./product";

// ─── Status ───────────────────────────────────────────────────────────────────
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

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recebido: "Pedido recebido",
  preparo: "Em preparo",
  pronto_entrega: "Pronto para entrega",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  falha_entrega: "Falha na entrega",
};

// ─── Staff (P3) ───────────────────────────────────────────────────────────────
export type StaffRole = "admin" | "cozinha" | "entrega";

export interface OrderStaffRef {
  id: string;
  name: string;
}

// ─── Falha de entrega (P3) ────────────────────────────────────────────────────
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

// ─── Carrinho ─────────────────────────────────────────────────────────────────
export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: Size;
  toppings: { id: string; name: string; price: number }[];
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
}

// ─── Pedido ───────────────────────────────────────────────────────────────────
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
  // Campos P3 — opcionais para retrocompatibilidade com pedidos antigos sem driver/cook
  cook?: OrderStaffRef | null;
  driver?: OrderStaffRef | null;
  deliveryFailure?: DeliveryFailure;
}

export type OrderInput = Omit<Order, "id" | "status" | "createdAt">;
