import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  type CustomerLoginInput,
  type CustomerRegisterInput,
  type CustomerSession,
} from "../services/customerAuthService";
import { setAuthToken } from "../services/api";

interface CustomerAuthState {
  session: CustomerSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (input: CustomerLoginInput) => Promise<void>;
  register: (input: CustomerRegisterInput) => Promise<void>;
  logout: () => void;
}

// Mesmo padrão do useAuthStore (staff), separado porque cliente e staff são
// sessões distintas (loja pública x telas internas). NOTA: api.ts guarda um
// único token ativo por aba — cliente e staff logados na MESMA aba ao mesmo
// tempo não é um cenário suportado hoje (o último login "vence"). Na prática
// loja e admin não são usados simultaneamente na mesma aba, mas é uma
// limitação a considerar se isso mudar.
export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      session: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      login: async (input) => {
        set({ loading: true, error: null });
        try {
          const session = await loginCustomer(input);
          set({ session, isAuthenticated: true, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false, isAuthenticated: false });
          throw e;
        }
      },

      register: async (input) => {
        set({ loading: true, error: null });
        try {
          const session = await registerCustomer(input);
          set({ session, isAuthenticated: true, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false, isAuthenticated: false });
          throw e;
        }
      },

      logout: () => {
        logoutCustomer();
        set({ session: null, isAuthenticated: false });
      },
    }),
    {
      name: "pizzashop-customer-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.session?.token) setAuthToken(state.session.token);
      },
    }
  )
);
