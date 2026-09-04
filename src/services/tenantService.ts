import { apiFetch } from "./api";
import type { TenantConfig } from "../types/tenant";

const TENANT_ENDPOINT = "/tenant";

export async function getTenantConfig(): Promise<TenantConfig> {
  return apiFetch<TenantConfig>(TENANT_ENDPOINT);
}

export async function updateTenantConfig(config: TenantConfig): Promise<TenantConfig> {
  return apiFetch<TenantConfig>(TENANT_ENDPOINT, {
    method: "PUT",
    body: JSON.stringify(config),
  });
}