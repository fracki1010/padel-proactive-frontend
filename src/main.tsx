import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ConfirmProvider } from "./hooks/useConfirm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./lib/firebase";
import { getDeviceKind } from "./lib/device";

const queryClient = new QueryClient();

// Background update detection only. PwaManager (useRegisterSW, prompt mode)
// surfaces the "Nueva versión disponible" banner and applies the update on user
// action. This registration of the same /sw.js URL is idempotent in the browser
// (deduped by scope); it exists solely so the poll below can detect updates
// without ever auto-applying or reloading the page.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(
      (registration) => {
        window.setInterval(() => {
          registration.update().catch(() => {
            // Transient error; the next interval retries.
          });
        }, 60_000);
      },
      () => {
        // Registration failure is non-fatal: PwaManager may still register the
        // SW, and the app works online regardless.
      },
    );
  });
}

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
          <ClientAuthProvider>
          <BrowserRouter>
            <HeroUIProvider className="text-foreground bg-background">
              <ToastProvider
                placement="top-center"
                toastOffset={toastOffset}
                toastProps={{ variant: "solid" }}
                regionProps={{ className: "toast-region-safe-top" }}
              />
              <ErrorBoundary>
                <ConfirmProvider>
                  <App />
                </ConfirmProvider>
              </ErrorBoundary>
            </HeroUIProvider>
          </BrowserRouter>
          </ClientAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
