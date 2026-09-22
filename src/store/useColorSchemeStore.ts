import { create } from "zustand";

export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "pizzashop:color-scheme";

function getSystemScheme(): ColorScheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialScheme(): ColorScheme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : getSystemScheme();
}

interface ColorSchemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
}

export const useColorSchemeStore = create<ColorSchemeState>((set) => ({
  scheme: getInitialScheme(),
  setScheme: (scheme) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, scheme);
    set({ scheme });
  },
  toggleScheme: () =>
    set((state) => {
      const scheme: ColorScheme = state.scheme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, scheme);
      return { scheme };
    }),
}));
