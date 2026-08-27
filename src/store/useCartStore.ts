import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types/order";

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
}

// Persistido no localStorage: o carrinho sobrevive a reload da página (requisito do enunciado).
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.cartItemId === item.cartItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),

      removeItem: (cartItemId) =>
        set((state) => ({ items: state.items.filter((i) => i.cartItemId !== cartItemId) })),

      increaseQuantity: (cartItemId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })),

      decreaseQuantity: (cartItemId) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: "pizzashop-cart" }
  )
);
