import { Button, Card, CardBody, Chip, Input, Select, SelectItem, Switch } from "@heroui/react";
import { CheckCircle2, ChevronLeft, QrCode, Save, Smartphone, TriangleAlert } from "lucide-react";

type WhatsappSettingsViewProps = {
  whatsappEnabled: boolean;
  whatsappStatus: string;
  whatsappQr: string;
  whatsappState: any;
  workerOnline: boolean;
  workerHeartbeatAt: string | null;
  isLoadingWhatsapp: boolean;
  updateWhatsappPending: boolean;
  whatsappChipColor: "default" | "success" | "danger" | "warning";
  whatsappStatusLabelByKey: Record<string, string>;
  cancellationGroupEnabled: boolean;
  cancellationGroupIdInput: string;
  cancellationGroupNameInput: string;
  whatsappGroups: Array<{ id: string; name: string }>;
  whatsappCommands: Array<{
    id: string;
    type: string;
    status: string;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    processedAt?: string | null;
  }>;
  isLoadingWhatsappCommands: boolean;
  commandStatusFilter: string;
  commandTypeFilter: string;
  retryingCommandId: string | null;
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
  onChangeCommandStatusFilter: (value: string) => void;
  onChangeCommandTypeFilter: (value: string) => void;
  onRetryWhatsappCommand: (commandId: string) => void;
};

export const WhatsappSettingsView = ({
  whatsappEnabled,
  whatsappStatus,
  whatsappQr,
  whatsappState,
  workerOnline,
  workerHeartbeatAt,
  isLoadingWhatsapp,
  updateWhatsappPending,
  whatsappChipColor,
  whatsappStatusLabelByKey,
  cancellationGroupEnabled,
  cancellationGroupIdInput,
  cancellationGroupNameInput,
  whatsappGroups,
  whatsappCommands,
  isLoadingWhatsappCommands,
  commandStatusFilter,
  commandTypeFilter,
  retryingCommandId,
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
  onChangeCommandStatusFilter,
  onChangeCommandTypeFilter,
  onRetryWhatsappCommand,
}: WhatsappSettingsViewProps) => {
  const isLockedElsewhere = whatsappStatus === "locked_elsewhere";
  const canManageSession =
    (whatsappEnabled || whatsappStatus === "logged_out") && !isLockedElsewhere;
  const statusLabel = whatsappStatusLabelByKey[whatsappStatus] || whatsappStatus;
  const canSaveCancellationGroup =
    !updateCancellationGroupPending &&
    (!cancellationGroupEnabled || Boolean(cancellationGroupIdInput.trim()));
  const commandStatusLabelByKey: Record<string, string> = {
    queued: "En cola",
    processing: "Procesando",
    done: "Completado",
    failed: "Fallido",
  };
  const nextStepMessage = !whatsappEnabled
    ? "Activá WhatsApp para iniciar el servicio."
    : whatsappStatus === "ready"
      ? "Conexión lista. Ya podés usar notificaciones."
      : whatsappStatus === "qr_pending"
        ? "Escaneá el QR con el teléfono administrador."
        : whatsappStatus === "locked_elsewhere"
          ? "Cerrá la otra instancia del backend para continuar."
          : "Esperando sincronización automática del backend.";

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onClick={onBack}
          className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <h3 className="text-xl font-black text-foreground uppercase italic">
          WhatsApp Web
        </h3>
      </div>

      <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-[2rem]">
        <CardBody className="p-6 space-y-5">
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Estado actual
              </p>
              <Chip
                color={whatsappChipColor}
                variant="flat"
                className="font-bold uppercase"
                size="sm"
              >
                {isLoadingWhatsapp ? "Cargando" : statusLabel}
              </Chip>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Siguiente paso
              </p>
              <p className="text-foreground font-bold text-sm">{nextStepMessage}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Worker WhatsApp
              </p>
              <div className="flex items-center gap-2">
                <Chip
                  color={workerOnline ? "success" : "danger"}
                  variant="flat"
                  className="font-bold uppercase"
                  size="sm"
                >
                  {workerOnline ? "Online" : "Offline"}
                </Chip>
                <p className="text-xs text-gray-400 font-medium">
                  Último heartbeat: {workerHeartbeatAt || "sin datos"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Activación Manual
              </p>
              <p className="text-foreground font-bold text-sm">
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
              <p className="text-foreground font-bold text-sm">
                Conexión y sesión sincronizadas con backend
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
              Cerrar sesión activa
            </Button>
            <Button
              variant="flat"
              color="warning"
              className="font-black uppercase text-black"
              isDisabled={updateWhatsappPending || !canManageSession}
              onPress={onSwitchWhatsappDevice}
            >
              Vincular otro dispositivo
            </Button>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
              Flujo recomendado
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Smartphone size={16} />
                  <p className="text-[10px] font-black uppercase tracking-wide">1. Activar</p>
                </div>
                <p className="text-xs text-gray-300 font-bold">
                  Encendé el switch manual para que el bot inicie.
                </p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-amber-300 mb-2">
                  <QrCode size={16} />
                  <p className="text-[10px] font-black uppercase tracking-wide">2. Escanear QR</p>
                </div>
                <p className="text-xs text-gray-300 font-bold">
                  Vinculá el teléfono administrador desde WhatsApp.
                </p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-emerald-300 mb-2">
                  <CheckCircle2 size={16} />
                  <p className="text-[10px] font-black uppercase tracking-wide">3. Operativo</p>
                </div>
                <p className="text-xs text-gray-300 font-bold">
                  Cuando diga Conectado, ya quedan activas las alertas.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Aviso a grupo por cancelaciones
                </p>
                <p className="text-foreground font-bold text-sm">
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
              isDisabled={updateCancellationGroupPending}
              classNames={{
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-foreground font-bold",
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
                trigger: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                label: "text-gray-400 font-bold mb-2",
                value: "text-foreground font-bold",
                popoverContent: "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                listbox: "text-foreground",
              }}
            >
              {whatsappGroups.map((group) => (
                <SelectItem key={group.id} className="text-foreground">
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
                isDisabled={updateCancellationGroupPending}
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                }}
              />
              <Button
                className="h-12 min-w-28 bg-primary text-black rounded-2xl font-black uppercase"
                isLoading={updateCancellationGroupPending}
                isDisabled={!canSaveCancellationGroup}
                onPress={onSaveCancellationGroup}
                startContent={<Save size={16} />}
              >
                Guardar
              </Button>
            </div>

            <p className="text-[10px] text-gray-500 font-bold italic">
              * El nombre es para identificarlo fácil en el panel. El envío real usa el ID @g.us.
            </p>
            {!whatsappGroups.length && !isLoadingWhatsappGroups && (
              <div className="bg-warning-500/10 border border-warning-500/30 rounded-2xl p-3 flex items-start gap-2">
                <TriangleAlert size={16} className="text-warning-300 mt-0.5 shrink-0" />
                <p className="text-[11px] text-warning-200 font-bold">
                  Todavía no encontramos grupos. Abrí WhatsApp Web en el dispositivo vinculado
                  y asegurate de tener al menos un grupo disponible.
                </p>
              </div>
            )}

          </div>

          {!whatsappEnabled ? (
            <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 border border-black/10 dark:border-white/10">
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
            <div className="bg-white rounded-3xl p-6 space-y-4">
              <p className="text-center text-dark-100 font-black uppercase text-xs tracking-wide">
                Escaneá este QR desde WhatsApp en tu celular
              </p>
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(whatsappQr)}`}
                  alt="Código QR de WhatsApp"
                  className="w-[220px] h-[220px] rounded-2xl"
                />
              </div>
            </div>
          ) : (
            <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 border border-black/10 dark:border-white/10">
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

          <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 border border-black/10 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Historial de comandos (últimos 20)
              </p>
              {isLoadingWhatsappCommands ? (
                <Chip size="sm" variant="flat" className="font-bold uppercase">
                  Cargando
                </Chip>
              ) : null}
            </div>

            {!whatsappCommands.length ? (
              <p className="text-xs text-gray-400 font-bold">
                No hay comandos recientes para mostrar.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select
                    label="Estado"
                    labelPlacement="outside"
                    placeholder="Todos"
                    selectedKeys={[commandStatusFilter || "__all__"]}
                    onSelectionChange={(keys) => {
                      if (keys === "all") return;
                      const selected = (Array.from(keys)[0] as string | undefined) || "__all__";
                      onChangeCommandStatusFilter(selected === "__all__" ? "" : selected);
                    }}
                    classNames={{
                      trigger: "bg-black/5 dark:bg-white/5 border-none h-11 rounded-2xl px-4",
                      label: "text-gray-400 font-bold mb-2",
                      value: "text-foreground font-bold",
                      popoverContent: "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                    }}
                  >
                    <SelectItem key="__all__" className="text-foreground">Todos</SelectItem>
                    <SelectItem key="queued" className="text-foreground">En cola</SelectItem>
                    <SelectItem key="processing" className="text-foreground">Procesando</SelectItem>
                    <SelectItem key="done" className="text-foreground">Completado</SelectItem>
                    <SelectItem key="failed" className="text-foreground">Fallido</SelectItem>
                  </Select>
                  <Select
                    label="Tipo"
                    labelPlacement="outside"
                    placeholder="Todos"
                    selectedKeys={[commandTypeFilter || "__all__"]}
                    onSelectionChange={(keys) => {
                      if (keys === "all") return;
                      const selected = (Array.from(keys)[0] as string | undefined) || "__all__";
                      onChangeCommandTypeFilter(selected === "__all__" ? "" : selected);
                    }}
                    classNames={{
                      trigger: "bg-black/5 dark:bg-white/5 border-none h-11 rounded-2xl px-4",
                      label: "text-gray-400 font-bold mb-2",
                      value: "text-foreground font-bold",
                      popoverContent: "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                    }}
                  >
                    <SelectItem key="__all__" className="text-foreground">Todos</SelectItem>
                    <SelectItem key="set_enabled" className="text-foreground">Activar/Desactivar</SelectItem>
                    <SelectItem key="send_message" className="text-foreground">Enviar mensaje</SelectItem>
                    <SelectItem key="restart_client" className="text-foreground">Reiniciar cliente</SelectItem>
                    <SelectItem key="list_groups" className="text-foreground">Listar grupos</SelectItem>
                    <SelectItem key="notify_cancellation_group" className="text-foreground">Aviso cancelación grupo</SelectItem>
                  </Select>
                </div>
                {whatsappCommands.map((command) => {
                  const status = String(command?.status || "").toLowerCase();
                  const statusLabel = commandStatusLabelByKey[status] || status || "Desconocido";
                  const chipColor: "default" | "success" | "warning" | "danger" =
                    status === "done"
                      ? "success"
                      : status === "failed"
                        ? "danger"
                        : status === "processing"
                          ? "warning"
                          : "default";

                  return (
                    <div
                      key={command.id}
                      className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-foreground font-black uppercase tracking-wide">
                          {command.type || "comando"}
                        </p>
                        <Chip size="sm" color={chipColor} variant="flat" className="font-bold uppercase">
                          {statusLabel}
                        </Chip>
                      </div>
                      <p className="text-[11px] text-gray-400 font-bold">
                        Intentos: {Number(command.attempts || 0)} / {Number(command.maxAttempts || 0)}
                      </p>
                      {!!command.lastError && (
                        <p className="text-[11px] text-danger-300 font-bold">
                          Error: {command.lastError}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500 font-bold italic">
                        Creado: {command.createdAt ? new Date(command.createdAt).toLocaleString() : "N/D"}
                      </p>
                      {status === "failed" ? (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            className="font-black uppercase text-black"
                            isLoading={retryingCommandId === command.id}
                            onPress={() => onRetryWhatsappCommand(command.id)}
                          >
                            Reintentar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
