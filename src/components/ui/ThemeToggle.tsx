import { Moon, Sun } from "lucide-react";
import { useColorScheme } from "../../hooks/useColorScheme";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { scheme, toggleScheme } = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleScheme}
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""}`}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      {!compact && <span>{isDark ? "Claro" : "Escuro"}</span>}
    </button>
  );
}
