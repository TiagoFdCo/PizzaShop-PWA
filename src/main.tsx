import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyColorScheme } from "./hooks/useColorScheme";
import { useColorSchemeStore } from "./store/useColorSchemeStore";
import "./index.css";
import "./design.css";

applyColorScheme(useColorSchemeStore.getState().scheme);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
