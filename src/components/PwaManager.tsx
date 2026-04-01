import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, addToast } from "@heroui/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const PwaManager = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("Error registrando Service Worker:", error);
    },
  });

  const canInstall = useMemo(() => !!installPrompt && !isStandalone(), [installPrompt]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      addToast({ title: "App instalada correctamente", color: "success" });
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    addToast({
      title: "Modo offline listo",
      description: "La app puede abrir aunque no tengas conexión.",
      color: "primary",
    });
  }, [offlineReady]);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      addToast({ title: "Instalación iniciada", color: "success" });
      setInstallPrompt(null);
      return;
    }

    addToast({ title: "Instalación cancelada", color: "default" });
  };

  return (
    <>
      {!isOnline && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+0.5rem)] left-1/2 -translate-x-1/2 z-[120]">
          <div className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-lg">
            <WifiOff size={14} />
            Sin conexión
          </div>
        </div>
      )}

      {canInstall && (
        <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[120]">
          <Button
            color="primary"
            className="h-12 rounded-2xl font-black shadow-xl shadow-primary/25"
            startContent={<Download size={16} />}
            onPress={handleInstall}
          >
            Instalar app
          </Button>
        </div>
      )}

      {needRefresh && (
        <div className="fixed left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+5.2rem)] z-[120]">
          <Card className="bg-dark-100 border border-primary/30 rounded-3xl shadow-2xl">
            <CardBody className="p-4 flex flex-col gap-3">
              <div>
                <p className="text-white font-black text-sm">Nueva versión disponible</p>
                <p className="text-gray-400 text-xs">
                  Actualizá para tener mejoras y correcciones recientes.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-primary text-black font-black"
                  startContent={<RefreshCw size={14} />}
                  onPress={() => updateServiceWorker(true)}
                >
                  Actualizar
                </Button>
                <Button
                  variant="flat"
                  className="flex-1"
                  startContent={<X size={14} />}
                  onPress={() => setNeedRefresh(false)}
                >
                  Más tarde
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {offlineReady && (
        <div className="fixed left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+5.2rem)] z-[110] pointer-events-none">
          <Card className="bg-dark-100/95 border border-white/10 rounded-3xl">
            <CardBody className="p-3">
              <p className="text-xs text-white font-bold text-center">
                App lista para funcionar sin conexión
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
};
