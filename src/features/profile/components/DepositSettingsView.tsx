import { Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import {
  ChevronLeft,
  KeyRound,
  Save,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";

type DepositSettingsViewProps = {
  depositEnabled: boolean;
  depositAmountInput: string;
  holdMinutesInput: string;
  accessTokenInput: string;
  credentialConfigured: boolean;
  credentialMasked: string;
  credentialMpUserId: string;
  maxDepositAmount: number;
  maxHoldMinutes: number;
  isLoading: boolean;
  isSavingSettings: boolean;
  isSavingCredential: boolean;
  isDeletingCredential: boolean;
  onBack: () => void;
  onToggleDepositEnabled: (enabled: boolean) => void;
  onDepositAmountChange: (value: string) => void;
  onHoldMinutesChange: (value: string) => void;
  onAccessTokenChange: (value: string) => void;
  onSaveSettings: () => void;
  onSaveCredential: () => void;
  onDeleteCredential: () => void;
};

const fieldClassNames = {
  inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-md px-4",
  input: "text-foreground font-bold",
  label: "text-on-surface-variant font-bold mb-2",
};

export const DepositSettingsView = ({
  depositEnabled,
  depositAmountInput,
  holdMinutesInput,
  accessTokenInput,
  credentialConfigured,
  credentialMasked,
  credentialMpUserId,
  maxDepositAmount,
  maxHoldMinutes,
  isLoading,
  isSavingSettings,
  isSavingCredential,
  isDeletingCredential,
  onBack,
  onToggleDepositEnabled,
  onDepositAmountChange,
  onHoldMinutesChange,
  onAccessTokenChange,
  onSaveSettings,
  onSaveCredential,
  onDeleteCredential,
}: DepositSettingsViewProps) => {
  const parsedAmount = Number(depositAmountInput);
  const parsedHoldMinutes = Number(holdMinutesInput);
  const isAmountValid =
    Number.isInteger(parsedAmount) &&
    parsedAmount >= 0 &&
    parsedAmount <= maxDepositAmount &&
    (!depositEnabled || parsedAmount > 0);
  const isHoldValid =
    Number.isInteger(parsedHoldMinutes) &&
    parsedHoldMinutes >= 1 &&
    parsedHoldMinutes <= maxHoldMinutes;
  const canSaveSettings =
    isAmountValid && isHoldValid && !isSavingSettings && !isLoading;
  const canSaveCredential =
    accessTokenInput.trim().length > 0 && !isSavingCredential && !isLoading;
  const statusLabel = credentialConfigured ? "Configurado" : "No configurado";

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          aria-label="Volver al menú de perfil"
          onClick={onBack}
          className="bg-black/5 dark:bg-white/5 text-foreground rounded-md"
        >
          <ChevronLeft size={20} />
        </Button>
        <h3 className="text-xl font-black text-foreground uppercase italic">
          Seña por MercadoPago
        </h3>
        {isLoading ? (
          <Chip
            size="sm"
            variant="flat"
            className="ml-auto font-bold uppercase"
          >
            Cargando configuración…
          </Chip>
        ) : null}
      </div>

      <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-lg">
        <CardBody className="p-6 space-y-5">
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-primary" />
              <p className="text-sm font-black text-foreground uppercase tracking-wide">
                Configuración de la seña
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Botón: Requiere seña
                </p>
                <p className="text-foreground font-bold text-sm">
                  Si está activo, las reservas nuevas piden el pago de una seña.
                </p>
              </div>
              <Switch
                isSelected={depositEnabled}
                onValueChange={onToggleDepositEnabled}
                isDisabled={isSavingSettings || isLoading}
                aria-label="Requiere seña"
                color="primary"
                size="sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Monto de la seña (ARS)"
                labelPlacement="outside"
                value={depositAmountInput}
                onValueChange={onDepositAmountChange}
                placeholder="5000"
                type="number"
                min={0}
                max={maxDepositAmount}
                isDisabled={isLoading}
                className="flex-grow"
                classNames={fieldClassNames}
              />
              <Input
                label="Retención del turno (minutos)"
                labelPlacement="outside"
                value={holdMinutesInput}
                onValueChange={onHoldMinutesChange}
                placeholder="15"
                type="number"
                min={1}
                max={maxHoldMinutes}
                isDisabled={isLoading}
                className="flex-grow"
                classNames={fieldClassNames}
              />
            </div>

            <Button
              className="h-12 w-full sm:w-auto bg-primary text-black dark:text-white rounded-md font-black uppercase"
              onPress={onSaveSettings}
              isLoading={isSavingSettings}
              isDisabled={!canSaveSettings}
              startContent={<Save size={18} />}
            >
              Guardar configuración
            </Button>

            <p className="text-[11px] text-on-surface-variant">
              La seña se descuenta del precio del turno. El monto debe ser mayor
              a 0 para activarla y la retención mínima es de 1 minuto.
            </p>
          </div>

          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <KeyRound size={18} className="text-sky-300" />
                <p className="text-sm font-black text-foreground uppercase tracking-wide">
                  Credencial de MercadoPago
                </p>
              </div>
              <Chip
                color={credentialConfigured ? "success" : "default"}
                size="sm"
                variant="flat"
                className="font-bold uppercase"
              >
                {statusLabel}
              </Chip>
            </div>

            {credentialConfigured ? (
              <div className="flex items-center gap-2 text-foreground font-bold">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="tracking-[0.3em]">{credentialMasked}</span>
                {credentialMpUserId ? (
                  <span className="text-[11px] text-on-surface-variant font-bold">
                    MP user: {credentialMpUserId}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] text-on-surface-variant">
                Todavía no hay un Access Token configurado para este club.
              </p>
            )}

            <Input
              label="Access Token (solo escritura)"
              labelPlacement="outside"
              value={accessTokenInput}
              onValueChange={onAccessTokenChange}
              placeholder="APP_USR-..."
              type="password"
              autoComplete="off"
              isDisabled={isLoading}
              className="flex-grow"
              classNames={fieldClassNames}
            />

            <p className="text-[11px] text-on-surface-variant">
              El token se guarda encriptado y nunca se vuelve a mostrar. Al
              guardar uno nuevo se reemplaza el anterior.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="h-12 bg-sky-300 text-black rounded-md font-black uppercase"
                onPress={onSaveCredential}
                isLoading={isSavingCredential}
                isDisabled={!canSaveCredential}
                startContent={<Save size={18} />}
              >
                {credentialConfigured ? "Actualizar token" : "Guardar token"}
              </Button>
              {credentialConfigured ? (
                <Button
                  className="h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md font-black uppercase"
                  onPress={onDeleteCredential}
                  isLoading={isDeletingCredential}
                  isDisabled={isDeletingCredential || isLoading}
                  startContent={<Trash2 size={18} />}
                >
                  Desactivar
                </Button>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
