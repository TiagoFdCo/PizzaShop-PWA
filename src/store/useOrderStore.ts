import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderInput } from "../types/order";
import { createOrder as createOrderService, getOrderById } from "../services/orderService";

interface OrderState {
  currentOrderId: string | null;
  lastOrder: Order | null;
  loading: boolean;
  error: string | null;
  placeOrder: (input: OrderInput) => Promise<Order>;
  refreshOrder: () => Promise<void>;
  reset: () => void;
}

// Guarda o pedido em andamento do cliente (persistido, para sobreviver a reload
// durante o acompanhamento). O status em si é sempre lido da API — este store
// só guarda "qual pedido estamos acompanhando agora".
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      currentOrderId: null,
      lastOrder: null,
      loading: false,
      error: null,

      placeOrder: async (input) => {
        set({ loading: true, error: null });
        try {
          const order = await createOrderService(input);
          set({ currentOrderId: order.id, lastOrder: order, loading: false });
          return order;
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },

      refreshOrder: async () => {
        const { currentOrderId } = get();
        if (!currentOrderId) return;
        try {
          const order = await getOrderById(currentOrderId);
          set({ lastOrder: order });
        } catch (e) {
          set({ error: (e as Error).message });
        }
      },

      reset: () => set({ currentOrderId: null, lastOrder: null, error: null }),
    }),
    { name: "pizzashop-order" }
  )
);
