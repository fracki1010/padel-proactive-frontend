import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "logo-2.svg", "offline.html"],
      manifest: {
        name: "Padexa",
        short_name: "Padexa",
        description:
          "Gestiona turnos, clientes y caja de tu club desde una app instalable.",
        theme_color: "#08080A",
        background_color: "#08080A",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "es",
        categories: ["sports", "business", "productivity"],
        icons: [
          {
            src: "/logo-2.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/logo-2.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "monochrome",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/[^/]+\/(?!api\/).*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              networkTimeoutSeconds: 4,
              precacheFallback: {
                fallbackURL: "/offline.html",
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/.*$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
