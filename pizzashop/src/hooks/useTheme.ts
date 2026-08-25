import { useEffect } from "react";
import { useTenantStore } from "../store/useTenantStore";

// Converte hex (#RRGGBB) em "R G B" para permitir opacidade dinâmica no Tailwind
// (usa-se assim no tailwind.config.ts: rgb(var(--color-primary) / <alpha-value>))
function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
}

export function useTheme() {
  const tenant = useTenantStore((state) => state.tenant);

  useEffect(() => {
    if (!tenant) return;

    const root = document.documentElement;

    try {
      root.style.setProperty("--color-primary", hexToRgbTriplet(tenant.primaryColor));
      root.style.setProperty("--color-secondary", hexToRgbTriplet(tenant.secondaryColor));
    } catch {
      console.warn("Cor de tema inválida no tenantConfig");
    }

    document.title = tenant.name;
  }, [tenant]);
}
