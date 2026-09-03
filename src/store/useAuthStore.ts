import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as loginService, logout as logoutService } from "../services/authService";
import type { AdminCredentials, AdminSession } from "../services/authService";
import type { StaffRole } from "../types/order";

// Sessão estendida: admin existente + campos de driver (P3)
// id e name ficam opcionais para não quebrar o admin atual que não os tem
export interface ExtendedSession extends AdminSession {
  id?: string;
  name?: string;
  role?: StaffRole;
}

interface AuthState {
  session: ExtendedSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: AdminCredentials) => Promise<void>;
  logout: () => void;
  // P3: seta sessão do entregador diretamente (sem precisar de login por enquanto)
  setDriverSession: (id: string, name: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const session = await loginService(credentials);
          set({ session: { ...session, role: "admin" }, isAuthenticated: true, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false, isAuthenticated: false });
          throw e;
        }
      },

      logout: () => {
        logoutService();
        set({ session: null, isAuthenticated: false });
      },

      // P3: usado pela tela do entregador para simular login
      setDriverSession: (id, name) => {
        set({
          session: {
            username: name,
            token: `driver-mock-${id}`,
            id,
            name,
            role: "entrega",
          },
          isAuthenticated: true,
        });
      },

      clearSession: () => {
        logoutService();
        set({ session: null, isAuthenticated: false });
      },
    }),
    { name: "pizzashop-admin-auth" }
  )
);
