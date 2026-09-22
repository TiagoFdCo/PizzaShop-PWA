import { useEffect } from "react";
import { useColorSchemeStore } from "../store/useColorSchemeStore";

export function applyColorScheme(scheme: "light" | "dark") {
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
}

export function useColorScheme() {
  const scheme = useColorSchemeStore((state) => state.scheme);

  useEffect(() => {
    applyColorScheme(scheme);
  }, [scheme]);

  return useColorSchemeStore();
}
