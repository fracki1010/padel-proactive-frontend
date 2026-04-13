import { Button, Card, CardBody, Chip, Input, Select, SelectItem, Switch } from "@heroui/react";
import { ChevronLeft, Save } from "lucide-react";

type WhatsappSettingsViewProps = {
  whatsappEnabled: boolean;
  whatsappStatus: string;
  whatsappQr: string;
  whatsappState: any;
  isLoadingWhatsapp: boolean;
  updateWhatsappPending: boolean;
  whatsappChipColor: "default" | "success" | "danger" | "warning";
  whatsappStatusLabelByKey: Record<string, string>;
  cancellationGroupEnabled: boolean;
  cancellationGroupIdInput: string;
  cancellationGroupNameInput: string;
  whatsappGroups: Array<{ id: string; name: string }>;
  isLoadingWhatsappGroups: boolean;
  updateCancellationGroupPending: boolean;
  onBack: () => void;
  onToggleWhatsapp: (enabled: boolean) => void;
  onCloseWhatsappSession: () => void;
  onSwitchWhatsappDevice: () => void;
  onCancellationGroupEnabledChange: (enabled: boolean) => void;
  onCancellationGroupIdChange: (value: string) => void;
  onCancellationGroupNameChange: (value: string) => void;
  onSelectWhatsappGroup: (groupId: string) => void;
  onSaveCancellationGroup: () => void;
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
  cancellationGroupEnabled,
  cancellationGroupIdInput,
  cancellationGroupNameInput,
  whatsappGroups,
  isLoadingWhatsappGroups,
  updateCancellationGroupPending,
  onBack,
  onToggleWhatsapp,
  onCloseWhatsappSession,
  onSwitchWhatsappDevice,
  onCancellationGroupEnabledChange,
  onCancellationGroupIdChange,
  onCancellationGroupNameChange,
  onSelectWhatsappGroup,
  onSaveCancellationGroup,
}: WhatsappSettingsViewProps) => {
  const isLockedElsewhere = whatsappStatus === "locked_elsewhere";
  const canManageSession =
    (whatsappEnabled || whatsappStatus === "logged_out") && !isLockedElsewhere;

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="flat"
              color="danger"
              className="font-black uppercase"
              isDisabled={updateWhatsappPending || !canManageSession}
              onPress={onCloseWhatsappSession}
            >
              Cerrar sesión
            </Button>
            <Button
              variant="flat"
              color="warning"
              className="font-black uppercase text-black"
              isDisabled={updateWhatsappPending || !canManageSession}
              onPress={onSwitchWhatsappDevice}
            >
              Cambiar dispositivo
            </Button>
          </div>

          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Aviso a grupo por cancelaciones
                </p>
                <p className="text-white font-bold text-sm">
                  El bot solo envía mensajes al grupo, no responde allí.
                </p>
              </div>
              <Switch
                isSelected={cancellationGroupEnabled}
                onValueChange={onCancellationGroupEnabledChange}
                isDisabled={updateCancellationGroupPending}
                color="primary"
                size="sm"
              />
            </div>

            <Input
              value={cancellationGroupNameInput}
              onValueChange={onCancellationGroupNameChange}
              placeholder="Nombre del grupo (ej: Cancelados Club Norte)"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />

            <Select
              label="Grupo de WhatsApp"
              placeholder={
                isLoadingWhatsappGroups
                  ? "Cargando grupos..."
                  : whatsappGroups.length
                    ? "Seleccioná un grupo"
                    : "No hay grupos disponibles"
              }
              labelPlacement="outside"
              selectedKeys={
                whatsappGroups.some((group) => group.id === cancellationGroupIdInput)
                  ? [cancellationGroupIdInput]
                  : []
              }
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                const selectedId = Array.from(keys)[0] as string | undefined;
                if (selectedId) onSelectWhatsappGroup(selectedId);
              }}
              isDisabled={isLoadingWhatsappGroups || !whatsappGroups.length}
              classNames={{
                trigger: "bg-white/5 border-none h-12 rounded-2xl px-4",
                label: "text-gray-400 font-bold mb-2",
                value: "text-white font-bold",
                popoverContent: "bg-dark-200 border border-white/10 text-white",
                listbox: "text-white",
              }}
            >
              {whatsappGroups.map((group) => (
                <SelectItem key={group.id} className="text-white">
                  {group.name}
                </SelectItem>
              ))}
            </Select>

            <div className="flex gap-2">
              <Input
                value={cancellationGroupIdInput}
                onValueChange={onCancellationGroupIdChange}
                placeholder="ID del grupo (ej: 54911...-123456@g.us)"
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-white font-bold",
                }}
              />
              <Button
                isIconOnly
                className="h-12 w-12 bg-primary text-black rounded-2xl"
                isLoading={updateCancellationGroupPending}
                onPress={onSaveCancellationGroup}
              >
                <Save size={20} />
              </Button>
            </div>

            <p className="text-[10px] text-gray-500 font-bold italic">
              * El nombre es para identificarlo fácil en el panel. El envío real usa el ID @g.us.
            </p>
          </div>

          {!whatsappEnabled ? (
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wide">
                {whatsappStatus === "logged_out"
                  ? "La sesión se cerró desde el dispositivo. Activá el switch para volver a generar el QR."
                  : "WhatsApp está desactivado. Activá el switch para iniciar y generar QR."}
              </p>
            </div>
          ) : isLockedElsewhere ? (
            <div className="bg-danger-500/10 rounded-3xl p-5 border border-danger-500/30">
              <p className="text-xs text-danger-300 font-bold uppercase tracking-wide">
                Esta empresa ya tiene WhatsApp activo en otro proceso del backend.
                Cerrá la otra instancia y volvé a intentar desde acá.
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
