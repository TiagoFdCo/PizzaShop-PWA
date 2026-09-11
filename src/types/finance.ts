export type ExpenseCategory =
  | "ingredientes"
  | "funcionarios"
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "manutencao"
  | "marketing"
  | "outros";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredientes: "Ingredientes",
  funcionarios: "Funcionários",
  aluguel: "Aluguel",
  energia: "Energia",
  agua: "Água",
  internet: "Internet",
  manutencao: "Manutenção",
  marketing: "Marketing",
  outros: "Outros",
};

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
}
