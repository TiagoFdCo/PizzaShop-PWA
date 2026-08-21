export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface PizzaSize {
  id: string;
  label: string;
  priceMultiplier: number;
}

export interface Pizza {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  imageUrl: string;
  sizes: PizzaSize[];
  availableToppings: Topping[];
  active: boolean;
}
