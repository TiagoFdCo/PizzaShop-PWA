export function tabName(tab: { label: string | null }): string {
  return tab.label ? `Comanda ${tab.label}` : "Comanda";
}