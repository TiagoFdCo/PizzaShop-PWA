import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as loginService, logout as logoutService } from "../services/authService";
import { setAuthToken } from "../services/api";
import type { LoginCredentials, StaffSession } from "../services/authService";
import type { StaffRole } from "../types/staff";

interface AuthState {
  session: StaffSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (roles: StaffRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
      hasRole: (roles) => {
        const role = get().session?.staff.role;
        return !!role && roles.includes(role);
      },
    }),
    {
      name: "pizzashop-staff-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.session?.token) setAuthToken(state.session.token);
      },
    }
  )
);