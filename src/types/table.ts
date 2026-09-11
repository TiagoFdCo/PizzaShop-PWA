export type TableStatus = "livre" | "ocupada";

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
}