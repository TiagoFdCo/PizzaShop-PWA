export type TabStatus = "aberta" | "fechada" | "paga";

export interface Tab {
  id: string;
  tableId: string;
  waiterId: string;
  status: TabStatus;
  orderIds: string[];
}