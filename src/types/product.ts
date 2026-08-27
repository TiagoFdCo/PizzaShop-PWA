// ATENÇÃO: este arquivo continha, por engano, o código do hook useFetch.
// Corrigido para conter os tipos de domínio de produto (pizzas), como previsto no plano.

export type Size = "P" | "M" | "G";

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface Pizza {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  category: string;
  availableSizes: Size[];
  availableToppings: Topping[];
}

// Payload usado pelo admin ao criar/editar uma pizza (sem id, gerado pela API mock)
export type PizzaInput = Omit<Pizza, "id">;
