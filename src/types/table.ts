export type TableStatus = "livre" | "ocupada" | "reservada";

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
}