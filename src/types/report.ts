/**
 * Types para os endpoints de relatório financeiro — Issue #75.
 * Mirrors exato dos schemas Pydantic com alias_generator=to_camel.
 */

export interface ChannelSummary {
  channel: "delivery" | "dine_in";
  revenue: number;
  cost: number;
  profit: number;
}

export interface StaffBreakdown {
  staffId: string;
  name: string;
  role: "entrega" | "garcom";
  ordersCount: number;
  revenue: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  averageRating: number | null;
  ordersCount: number;
  channelBreakdown: ChannelSummary[];
  staffBreakdown: StaffBreakdown[];
}

export interface OrderLedgerRow {
  orderId: string;
  createdAt: string;
  channel: "delivery" | "dine_in";
  customerName: string;
  cookName: string | null;
  driverName: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  cost: number;
  profit: number;
  rating: number | null;
  status: string;
}
