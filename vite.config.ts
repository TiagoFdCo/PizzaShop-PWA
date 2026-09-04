import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "PizzaShop — Pizzaria Online",
        short_name: "PizzaShop",
        description: "Peça sua pizza favorita online, do jeito que você quiser.",
        theme_color: "#c0392b",
        background_color: "#fff8f0",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      // Em dev o SW NÃO é registrado (devOptions.enabled fica false por padrão),
      // então o service worker só entra no `build`/`preview`.
      workbox: {
        // Só faz cache de imagens da MESMA origem. A API fica em outra origem
        // (:8000) e é deixada passar direto — assim o SW nunca intercepta nem
        // reenvia as chamadas de /products, /tenant etc., o que evita a
        // enxurrada de requisições (ERR_INSUFFICIENT_RESOURCES) quando o SW
        // fica ativo depois de um build/preview.
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
            handler: "CacheFirst",
            options: { cacheName: "pizzashop-images", expiration: { maxEntries: 60 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    css: true,
  },
});
