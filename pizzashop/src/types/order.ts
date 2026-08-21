export type OrderStatus = "recebido" | "preparo" | "saiu_entrega" | "entregue";

export interface CartItem {
  productId: string;
  name: string;
  size: string;
  toppings: string[];
  quantity: number;
  unitPrice: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  tenantId: string;
  items: CartItem[];
  customer: OrderCustomer;
  paymentMethod: "pix" | "cartao" | "dinheiro";
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
