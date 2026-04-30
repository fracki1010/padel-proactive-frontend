import { Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import {
  CalendarClock,
  ChevronLeft,
  FileText,
  Image,
  Save,
  Send,
  ShieldAlert,
  Timer,
  UserCheck,
} from "lucide-react";
import type { DigestBackground } from "../../../services/configService";
import { DigestBackgroundsGrid } from "./DigestBackgroundsGrid";

type BotAutomationSettingsViewProps = {
  oneHourReminderEnabled: boolean;
  penaltyEnabled: boolean;
  attendanceReminderLeadMinutesInput: string;
  attendanceResponseTimeoutMinutesInput: string;
  cancellationLockHoursInput: string;
  trustedClientConfirmationCountInput: string;
  penaltyLimitInput: string;
  dailyAvailabilityDigestEnabled: boolean;
  dailyAvailabilityDigestHourInput: string;
  dailyAvailabilityDigestNextDayEnabled: boolean;
  dailyAvailabilityDigestFormat: "text" | "image";
  cancellationGroupConfigured: boolean;
  isSavingReminderToggle: boolean;
  isSavingPenaltyToggle: boolean;
  isSavingReminderMinutes: boolean;
  isSavingResponseTimeoutMinutes: boolean;
  isSavingCancellationLockHours: boolean;
  isSavingTrustedCount: boolean;
  isSavingPenaltyLimit: boolean;
  isSavingDailyAvailabilityDigestSettings: boolean;
  onBack: () => void;
  onToggleOneHourReminder: (enabled: boolean) => void;
  onTogglePenaltyEnabled: (enabled: boolean) => void;
  onAttendanceReminderLeadMinutesChange: (value: string) => void;
  onAttendanceResponseTimeoutMinutesChange: (value: string) => void;
  onCancellationLockHoursChange: (value: string) => void;
  onTrustedClientConfirmationCountChange: (value: string) => void;
  onPenaltyLimitChange: (value: string) => void;
  onToggleDailyAvailabilityDigest: (enabled: boolean) => void;
  onDailyAvailabilityDigestHourChange: (value: string) => void;
  onToggleDailyAvailabilityDigestNextDay: (enabled: boolean) => void;
  onDailyAvailabilityDigestFormatChange: (format: "text" | "image") => void;
  digestBackgrounds: DigestBackground[];
  isUploadingBackground: boolean;
  isDeletingBackground: boolean;
  onUploadBackground: (file: File, order: number) => void;
  onDeleteBackground: (id: string) => void;
  onSaveReminderMinutes: () => void;
  onSaveAttendanceResponseTimeoutMinutes: () => void;
  onSaveCancellationLockHours: () => void;
  onSaveTrustedCount: () => void;
  onSavePenaltyLimit: () => void;
  onSaveDailyAvailabilityDigestSettings: () => void;
  onSendDigestNow: () => void;
  isSendingDigestNow: boolean;
};

export const BotAutomationSettingsView = ({
  oneHourReminderEnabled,
  penaltyEnabled,
  attendanceReminderLeadMinutesInput,
  attendanceResponseTimeoutMinutesInput,
  cancellationLockHoursInput,
  trustedClientConfirmationCountInput,
  penaltyLimitInput,
  dailyAvailabilityDigestEnabled,
  dailyAvailabilityDigestHourInput,
  dailyAvailabilityDigestNextDayEnabled,
  dailyAvailabilityDigestFormat,
  cancellationGroupConfigured,
  isSavingReminderToggle,
  isSavingPenaltyToggle,
  isSavingReminderMinutes,
  isSavingResponseTimeoutMinutes,
  isSavingCancellationLockHours,
  isSavingTrustedCount,
  isSavingPenaltyLimit,
  isSavingDailyAvailabilityDigestSettings,
  onBack,
  onToggleOneHourReminder,
  onTogglePenaltyEnabled,
  onAttendanceReminderLeadMinutesChange,
  onAttendanceResponseTimeoutMinutesChange,
  onCancellationLockHoursChange,
  onTrustedClientConfirmationCountChange,
  onPenaltyLimitChange,
  onToggleDailyAvailabilityDigest,
  onDailyAvailabilityDigestHourChange,
  onToggleDailyAvailabilityDigestNextDay,
  onDailyAvailabilityDigestFormatChange,
  digestBackgrounds,
  isUploadingBackground,
  isDeletingBackground,
  onUploadBackground,
  onDeleteBackground,
  onSaveReminderMinutes,
  onSaveAttendanceResponseTimeoutMinutes,
  onSaveCancellationLockHours,
  onSaveTrustedCount,
  onSavePenaltyLimit,
  onSaveDailyAvailabilityDigestSettings,
  onSendDigestNow,
  isSendingDigestNow,
}: BotAutomationSettingsViewProps) => {
  const penaltyStatusLabel = penaltyEnabled
    ? `Activas (${penaltyLimitInput || "0"})`
    : "Inactivas";
  const canSaveDailyAvailabilityDigest =
    cancellationGroupConfigured &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(dailyAvailabilityDigestHourInput) &&
    !isSavingDailyAvailabilityDigestSettings;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
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
          Automatización del Bot
        </h3>
      </div>

      <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-[2rem]">
        <CardBody className="p-6 space-y-5">
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Timer size={18} className="text-primary" />
              <p className="text-sm font-black text-foreground uppercase tracking-wide">
                Recordatorio previo
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Botón: Activar recordatorio
                </p>
                <p className="text-foreground font-bold text-sm">
                  Enciende o apaga la pregunta de asistencia antes del turno.
                </p>
              </div>
              <Switch
                isSelected={oneHourReminderEnabled}
                onValueChange={onToggleOneHourReminder}
                isDisabled={isSavingReminderToggle}
                color="primary"
                size="sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Minutos de anticipación"
                labelPlacement="outside"
                value={attendanceReminderLeadMinutesInput}
                onValueChange={onAttendanceReminderLeadMinutesChange}
                placeholder="60"
                type="number"
                min={5}
                max={240}
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                  label: "text-gray-400 font-bold mb-2",
                }}
              />
              <Button
                className="h-12 bg-primary text-black rounded-2xl font-black uppercase"
                onPress={onSaveReminderMinutes}
                isLoading={isSavingReminderMinutes}
                startContent={<Save size={18} />}
              >
                Guardar minutos
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              El botón guarda cuántos minutos antes se dispara el aviso.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Tiempo máximo de espera (minutos)"
                labelPlacement="outside"
                value={attendanceResponseTimeoutMinutesInput}
                onValueChange={onAttendanceResponseTimeoutMinutesChange}
                placeholder="15"
                type="number"
                min={1}
                max={240}
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                  label: "text-gray-400 font-bold mb-2",
                }}
              />
              <Button
                className="h-12 bg-primary text-black rounded-2xl font-black uppercase"
                onPress={onSaveAttendanceResponseTimeoutMinutes}
                isLoading={isSavingResponseTimeoutMinutes}
                startContent={<Save size={18} />}
              >
                Guardar espera
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              Si el cliente no responde dentro de este tiempo, el bot avisa al admin.
            </p>
          </div>

          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <CalendarClock size={18} className="text-sky-300" />
              <p className="text-sm font-black text-foreground uppercase tracking-wide">
                Disponibilidad diaria al grupo
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Aviso de hoy
                </p>
                <p className="text-foreground font-bold text-sm">
                  Envía la disponibilidad del dia en curso al grupo de WhatsApp.
                </p>
              </div>
              <Switch
                isSelected={dailyAvailabilityDigestEnabled}
                onValueChange={onToggleDailyAvailabilityDigest}
                isDisabled={
                  !cancellationGroupConfigured || isSavingDailyAvailabilityDigestSettings
                }
                color="primary"
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Aviso del dia siguiente
                </p>
                <p className="text-foreground font-bold text-sm">
                  Si se activa, también envia la disponibilidad de manana.
                </p>
              </div>
              <Switch
                isSelected={dailyAvailabilityDigestNextDayEnabled}
                onValueChange={onToggleDailyAvailabilityDigestNextDay}
                isDisabled={
                  !cancellationGroupConfigured || isSavingDailyAvailabilityDigestSettings
                }
                color="primary"
                size="sm"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Formato del mensaje
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onDailyAvailabilityDigestFormatChange("text")}
                  disabled={!cancellationGroupConfigured}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl font-black text-sm uppercase transition-colors ${
                    dailyAvailabilityDigestFormat === "text"
                      ? "bg-sky-300 text-black"
                      : "bg-black/5 dark:bg-white/5 text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <FileText size={16} />
                  Texto
                </button>
                <button
                  type="button"
                  onClick={() => onDailyAvailabilityDigestFormatChange("image")}
                  disabled={!cancellationGroupConfigured}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl font-black text-sm uppercase transition-colors ${
                    dailyAvailabilityDigestFormat === "image"
                      ? "bg-sky-300 text-black"
                      : "bg-black/5 dark:bg-white/5 text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Image size={16} />
                  Imagen
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                "Imagen" envía una tarjeta visual al grupo; "Texto" envía el mensaje plano.
              </p>
            </div>

            {dailyAvailabilityDigestFormat === "image" && (
              <DigestBackgroundsGrid
                backgrounds={digestBackgrounds}
                isUploading={isUploadingBackground}
                isDeleting={isDeletingBackground}
                onUpload={onUploadBackground}
                onDelete={onDeleteBackground}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Hora de envio"
                labelPlacement="outside"
                value={dailyAvailabilityDigestHourInput}
                onValueChange={onDailyAvailabilityDigestHourChange}
                type="time"
                isDisabled={!cancellationGroupConfigured}
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                  label: "text-gray-400 font-bold mb-2",
                }}
              />
              <Button
                className="h-12 bg-sky-300 text-black rounded-2xl font-black uppercase"
                onPress={onSaveDailyAvailabilityDigestSettings}
                isLoading={isSavingDailyAvailabilityDigestSettings}
                isDisabled={!canSaveDailyAvailabilityDigest}
                startContent={<Save size={18} />}
              >
                Guardar horario
              </Button>
              <Button
                className="h-12 bg-primary/10 text-primary border border-primary/30 rounded-2xl font-black uppercase"
                onPress={onSendDigestNow}
                isLoading={isSendingDigestNow}
                isDisabled={!cancellationGroupConfigured || isSendingDigestNow}
                startContent={<Send size={18} />}
              >
                Enviar ahora
              </Button>
            </div>

            {!cancellationGroupConfigured ? (
              <p className="text-[11px] text-amber-300 font-bold">
                Primero configurá el grupo de WhatsApp en la seccion WhatsApp Web.
              </p>
            ) : (
              <p className="text-[11px] text-gray-400">
                El admin decide si quiere aviso del dia actual, del dia siguiente y a qué hora.
              </p>
            )}
          </div>

          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Timer size={18} className="text-cyan-300" />
              <p className="text-sm font-black text-foreground uppercase tracking-wide">
                Reglas de cancelación
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Bloqueo de cancelación (horas)"
                labelPlacement="outside"
                value={cancellationLockHoursInput}
                onValueChange={onCancellationLockHoursChange}
                placeholder="2"
                type="number"
                min={0}
                max={72}
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                  label: "text-gray-400 font-bold mb-2",
                }}
              />
              <Button
                className="h-12 bg-cyan-300 text-black rounded-2xl font-black uppercase"
                onPress={onSaveCancellationLockHours}
                isLoading={isSavingCancellationLockHours}
                startContent={<Save size={18} />}
              >
                Guardar bloqueo
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              Si faltan menos horas que este valor, el cliente no podrá cancelar por bot y deberá contactar al admin.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <UserCheck size={18} className="text-emerald-400" />
              <p className="text-sm font-black text-foreground uppercase tracking-wide">
                Cliente confiable
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Confirmaciones necesarias"
                labelPlacement="outside"
                value={trustedClientConfirmationCountInput}
                onValueChange={onTrustedClientConfirmationCountChange}
                placeholder="3"
                type="number"
                min={1}
                max={20}
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                  label: "text-gray-400 font-bold mb-2",
                }}
              />
              <Button
                className="h-12 bg-emerald-400 text-black rounded-2xl font-black uppercase"
                onPress={onSaveTrustedCount}
                isLoading={isSavingTrustedCount}
                startContent={<Save size={18} />}
              >
                Guardar umbral
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              El botón define cuántas confirmaciones necesita un cliente para dejar de recibir ese aviso.
            </p>
          </div>

          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className="text-orange-400" />
                <p className="text-sm font-black text-foreground uppercase tracking-wide">
                  Penalizaciones
                </p>
              </div>
              <Chip
                color={penaltyEnabled ? "warning" : "default"}
                size="sm"
                variant="flat"
                className="font-bold uppercase"
              >
                {penaltyStatusLabel}
              </Chip>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Botón: Activar penalizaciones
              </p>
              <p className="text-foreground font-bold text-sm">
                Si está apagado, las cancelaciones no suman sanciones.
              </p>
            </div>
            <Switch
              isSelected={penaltyEnabled}
              onValueChange={onTogglePenaltyEnabled}
              isDisabled={isSavingPenaltyToggle}
              color="warning"
              size="sm"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Límite de penalizaciones"
                labelPlacement="outside"
                value={penaltyLimitInput}
                onValueChange={onPenaltyLimitChange}
                placeholder="2"
                type="number"
                min={1}
                isDisabled={!penaltyEnabled}
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-foreground font-bold",
                  label: "text-gray-400 font-bold mb-2",
                }}
              />
              <Button
                className="h-12 bg-orange-400 text-black rounded-2xl font-black uppercase"
                onPress={onSavePenaltyLimit}
                isLoading={isSavingPenaltyLimit}
                isDisabled={!penaltyEnabled}
                startContent={<Save size={18} />}
              >
                Guardar limite
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              El botón guarda cuántas cancelaciones disparan suspensión automática.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
