import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../../src/store/useCartStore";
import type { CartItem } from "../../src/types/order";

function makeItem(overrides: Partial<Omit<CartItem, "quantity">> = {}): Omit<CartItem, "quantity"> {
  return {
    cartItemId: "pizza-calabresa-M",
    productId: "1",
    name: "Calabresa",
    imageUrl: "https://placehold.co/1x1",
    size: "M",
    toppings: [],
    unitPrice: 39.9,
    ...overrides,
  };
}

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    localStorage.clear();
  });

  it("começa vazio", () => {
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().subtotal()).toBe(0);
  });

  it("adiciona um item novo com quantidade padrão 1", () => {
    useCartStore.getState().addItem(makeItem());
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  it("soma a quantidade ao adicionar o mesmo cartItemId de novo", () => {
    const item = makeItem();
    useCartStore.getState().addItem(item, 2);
    useCartStore.getState().addItem(item, 3);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it("trata itens com cartItemId diferente como linhas separadas", () => {
    useCartStore.getState().addItem(makeItem({ cartItemId: "a" }));
    useCartStore.getState().addItem(makeItem({ cartItemId: "b" }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("increaseQuantity soma 1 à linha correspondente", () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().increaseQuantity("pizza-calabresa-M");
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("decreaseQuantity remove a linha quando chega a zero", () => {
    useCartStore.getState().addItem(makeItem(), 1);
    useCartStore.getState().decreaseQuantity("pizza-calabresa-M");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removeItem tira a linha independente da quantidade", () => {
    useCartStore.getState().addItem(makeItem(), 5);
    useCartStore.getState().removeItem("pizza-calabresa-M");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("clearCart esvazia o carrinho inteiro", () => {
    useCartStore.getState().addItem(makeItem({ cartItemId: "a" }));
    useCartStore.getState().addItem(makeItem({ cartItemId: "b" }));
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("subtotal soma unitPrice * quantity de todas as linhas", () => {
    useCartStore.getState().addItem(makeItem({ cartItemId: "a", unitPrice: 10 }), 2);
    useCartStore.getState().addItem(makeItem({ cartItemId: "b", unitPrice: 5 }), 3);
    expect(useCartStore.getState().subtotal()).toBe(35);
  });
});