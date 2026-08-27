import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ligadas às CSS Variables injetadas por useTheme() a partir do tenantConfig.
        // Uso: bg-primary, text-primary, border-primary/50 (suporta opacidade)
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Fraunces'", "serif"],
      },
      boxShadow: {
        card: "0 8px 24px -12px rgb(0 0 0 / 0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
