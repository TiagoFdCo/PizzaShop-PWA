import type { Pizza } from "../types/product";

const MOCK_PRODUCTS: Pizza[] = [
  {
    id: "1",
    name: "Calabresa",
    description: "Molho, mussarela, calabresa fatiada, cebola e orégano",
    imageUrl: "https://placehold.co/300x200?text=Calabresa",
    basePrice: 39.9,
    category: "salgada",
    availableSizes: ["P", "M", "G"],
    availableToppings: [
      { id: "t1", name: "Borda recheada", price: 8 },
      { id: "t2", name: "Bacon extra", price: 6 },
    ],
  },
  {
    id: "2",
    name: "Margherita",
    description: "Molho, mussarela de búfala, tomate e manjericão fresco",
    imageUrl: "https://placehold.co/300x200?text=Margherita",
    basePrice: 42.5,
    category: "salgada",
    availableSizes: ["M", "G"],
    availableToppings: [{ id: "t1", name: "Borda recheada", price: 8 }],
  },
  {
    id: "3",
    name: "Chocolate com Morango",
    description: "Chocolate ao leite, morangos frescos e granulado",
    imageUrl: "https://placehold.co/300x200?text=Doce",
    basePrice: 36.0,
    category: "doce",
    availableSizes: ["P", "M"],
    availableToppings: [],
  },
];

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getProducts(): Promise<Pizza[]> {
  return delay(MOCK_PRODUCTS);
}

export async function getProductById(id: string): Promise<Pizza> {
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error(`Produto ${id} não encontrado`);
  return delay(product, 400);
}