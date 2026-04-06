import { Button, Card, CardBody, Chip, Switch } from "@heroui/react";
import { ChevronLeft } from "lucide-react";

type WhatsappSettingsViewProps = {
  whatsappEnabled: boolean;
  whatsappStatus: string;
  whatsappQr: string;
  whatsappState: any;
  isLoadingWhatsapp: boolean;
  updateWhatsappPending: boolean;
  whatsappChipColor: "default" | "success" | "danger" | "warning";
  whatsappStatusLabelByKey: Record<string, string>;
  onBack: () => void;
  onToggleWhatsapp: (enabled: boolean) => void;
};

export const WhatsappSettingsView = ({
  whatsappEnabled,
  whatsappStatus,
  whatsappQr,
  whatsappState,
  isLoadingWhatsapp,
  updateWhatsappPending,
  whatsappChipColor,
  whatsappStatusLabelByKey,
  onBack,
  onToggleWhatsapp,
}: WhatsappSettingsViewProps) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onClick={onBack}
          className="bg-white/5 text-white rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <h3 className="text-xl font-black text-white uppercase italic">
          WhatsApp Web
        </h3>
      </div>

      <Card className="bg-dark-100 border border-white/5 rounded-[2rem]">
        <CardBody className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Activación Manual
              </p>
              <p className="text-white font-bold text-sm">
                Si está desactivado, WhatsApp queda en reposo.
              </p>
            </div>
            <Switch
              isSelected={whatsappEnabled}
              onValueChange={onToggleWhatsapp}
              isDisabled={updateWhatsappPending}
              color="primary"
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Estado del bot
              </p>
              <p className="text-white font-bold text-sm">
                QR sincronizado con el backend
              </p>
            </div>
            <Chip
              color={whatsappChipColor}
              variant="flat"
              className="font-bold uppercase"
              size="sm"
            >
              {isLoadingWhatsapp
                ? "Cargando"
                : (whatsappStatusLabelByKey[whatsappStatus] || whatsappStatus)}
            </Chip>
          </div>

          {!whatsappEnabled ? (
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wide">
                WhatsApp está desactivado. Activá el switch para iniciar y generar QR.
              </p>
            </div>
          ) : whatsappStatus === "qr_pending" && whatsappQr ? (
            <div className="bg-white rounded-3xl p-6 flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(whatsappQr)}`}
                alt="Código QR de WhatsApp"
                className="w-[220px] h-[220px] rounded-2xl"
              />
            </div>
          ) : (
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wide">
                {whatsappStatus === "ready"
                  ? "WhatsApp ya está conectado. Si querés regenerar el QR, cerrá sesión del dispositivo actual."
                  : "El QR aparecerá acá automáticamente cuando WhatsApp lo requiera."}
              </p>
            </div>
          )}

          {!!whatsappState?.updatedAt && (
            <p className="text-[10px] text-gray-500 font-bold italic">
              Última actualización:{" "}
              {new Date(whatsappState.updatedAt).toLocaleString()}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
