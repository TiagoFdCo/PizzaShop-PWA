import { create } from "zustand";
import type { TenantConfig } from "../types/tenant";
import { getTenantConfig, updateTenantConfig } from "../services/tenantService";

interface TenantState {
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;
  loadTenant: () => Promise<void>;
  saveTenant: (config: TenantConfig) => Promise<void>;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  loading: false,
  error: null,
  loadTenant: async () => {
    set({ loading: true, error: null });
    try {
      const tenant = await getTenantConfig();
      set({ tenant, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  saveTenant: async (config) => {
    const updated = await updateTenantConfig(config);
    set({ tenant: updated });
  },
}));
