import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./lib/firebase";
import { getDeviceKind } from "./lib/device";
import { registerSW } from "virtual:pwa-register";

const queryClient = new QueryClient();
registerSW({ immediate: true });
const deviceKind = getDeviceKind();
const isMobileViewport =
  typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
const toastOffset = (() => {
  if (deviceKind === "iphone") return 100;
  if (deviceKind === "android") return 84;
  if (isMobileViewport) return 72;
  return 16;
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <HeroUIProvider className="text-foreground bg-background">
              <ToastProvider
                placement="top-center"
                toastOffset={toastOffset}
                toastProps={{ variant: "solid" }}
                regionProps={{ className: "toast-region-safe-top" }}
              />
              <App />
            </HeroUIProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
