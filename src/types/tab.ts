import type { OrderItem } from "./order";

export type TabStatus = "aberta" | "fechada" | "paga";

export interface TabOrder {
  id: string;
  items: OrderItem[];
  channel: "dine_in";
  subtotal: number;
  total: number;
  createdAt: string;
}

export interface Tab {
  id: string;
  tableId: string;
  tableNumber: number;
  waiterId: string | null;
  status: TabStatus;
  openedAt: string;
  closedAt: string | null;
  total: number;
  orders: TabOrder[];
}