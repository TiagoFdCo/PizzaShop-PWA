import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as loginService, logout as logoutService } from "../services/authService";
import type { AdminCredentials, AdminSession } from "../services/authService";

interface AuthState {
  session: AdminSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: AdminCredentials) => Promise<void>;
  logout: () => void;
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
          set({ session, isAuthenticated: true, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false, isAuthenticated: false });
          throw e;
        }
      },
      logout: () => {
        logoutService();
        set({ session: null, isAuthenticated: false });
      },
    }),
    { name: "pizzashop-admin-auth" }
  )
);
