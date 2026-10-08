import { addToast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import {
  useDeleteMercadoPagoCredential,
  useDepositSettings,
  useSetMercadoPagoCredential,
  useUpdateDepositSettings,
} from "../../../hooks/useData";

const MAX_DEPOSIT_AMOUNT = 10000000;
const MAX_HOLD_MINUTES = 1440;
const DEFAULT_HOLD_MINUTES = 15;

const resolveErrorMessage = (err: unknown, fallback: string): string => {
  const responseError = (
    err as { response?: { data?: { error?: string } } } | null
  )?.response?.data?.error;
  if (typeof responseError === "string" && responseError) return responseError;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export const useDepositSettingsManagement = () => {
  const { data: depositSettingsData, isLoading } = useDepositSettings();
  const updateDepositSettings = useUpdateDepositSettings();
  const setMercadoPagoCredential = useSetMercadoPagoCredential();
  const deleteMercadoPagoCredential = useDeleteMercadoPagoCredential();

  const [depositEnabledInput, setDepositEnabledInput] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [holdMinutesInput, setHoldMinutesInput] = useState(
    String(DEFAULT_HOLD_MINUTES),
  );
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingCredential, setIsSavingCredential] = useState(false);
  const [isDeletingCredential, setIsDeletingCredential] = useState(false);

  // Seed the local form only from the FIRST successful load so a background or
  // post-mutation refetch cannot silently replace in-progress edits.
  const hasLoadedRef = useRef(false);
  const credentials = depositSettingsData?.credentials;
  // "Ready" means we have server data to diff against; saving before that would
  // PUT the initial defaults over the real config.
  const isReady = !isLoading && Boolean(depositSettingsData);

  useEffect(() => {
    if (!depositSettingsData || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setDepositEnabledInput(Boolean(depositSettingsData.depositEnabled));
    setDepositAmountInput(String(depositSettingsData.depositAmount ?? 0));
    setHoldMinutesInput(
      String(depositSettingsData.holdMinutes ?? DEFAULT_HOLD_MINUTES),
    );
  }, [depositSettingsData]);

  // Never keep the write-only token in memory once the view unmounts.
  useEffect(
    () => () => {
      setAccessTokenInput("");
    },
    [],
  );

  const handleSaveSettings = async () => {
    if (!isReady) return;
    const parsedAmount = Number(depositAmountInput);
    const parsedHoldMinutes = Number(holdMinutesInput);

    if (
      !Number.isInteger(parsedAmount) ||
      parsedAmount < 0 ||
      parsedAmount > MAX_DEPOSIT_AMOUNT
    ) {
      addToast({
        title: `El monto de la seña debe ser un entero entre 0 y ${MAX_DEPOSIT_AMOUNT}.`,
        color: "danger",
      });
      return;
    }

    if (depositEnabledInput && parsedAmount <= 0) {
      addToast({
        title: "Para activar la seña, el monto debe ser mayor a 0.",
        color: "danger",
      });
      return;
    }

    if (
      !Number.isInteger(parsedHoldMinutes) ||
      parsedHoldMinutes < 1 ||
      parsedHoldMinutes > MAX_HOLD_MINUTES
    ) {
      addToast({
        title: `El tiempo de retención debe ser un entero entre 1 y ${MAX_HOLD_MINUTES} minutos.`,
        color: "danger",
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      await updateDepositSettings.mutateAsync({
        depositEnabled: depositEnabledInput,
        depositAmount: parsedAmount,
        holdMinutes: parsedHoldMinutes,
      });
      addToast({ title: "Configuración de seña guardada", color: "success" });
    } catch (err: unknown) {
      addToast({
        title: resolveErrorMessage(
          err,
          "No se pudo guardar la configuración de seña",
        ),
        color: "danger",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveCredential = async () => {
    if (!isReady) return;
    const normalizedToken = accessTokenInput.trim();
    if (!normalizedToken) {
      addToast({
        title: "Ingresá el Access Token de MercadoPago.",
        color: "danger",
      });
      return;
    }

    setIsSavingCredential(true);
    try {
      await setMercadoPagoCredential.mutateAsync({
        accessToken: normalizedToken,
      });
      setAccessTokenInput("");
      addToast({ title: "Credencial de MercadoPago guardada", color: "success" });
    } catch (err: unknown) {
      addToast({
        title: resolveErrorMessage(
          err,
          "No se pudo guardar la credencial de MercadoPago",
        ),
        color: "danger",
      });
    } finally {
      setIsSavingCredential(false);
    }
  };

  const handleDeleteCredential = async () => {
    if (!isReady) return;
    setIsDeletingCredential(true);
    try {
      await deleteMercadoPagoCredential.mutateAsync();
      setAccessTokenInput("");
      addToast({
        title: "Credencial de MercadoPago desactivada",
        color: "success",
      });
    } catch (err: unknown) {
      addToast({
        title: resolveErrorMessage(
          err,
          "No se pudo desactivar la credencial de MercadoPago",
        ),
        color: "danger",
      });
    } finally {
      setIsDeletingCredential(false);
    }
  };

  // Called when the admin leaves the view so the token does not linger.
  const handleLeaveView = () => setAccessTokenInput("");

  return {
    isLoading,
    isReady,
    depositEnabledInput,
    depositAmountInput,
    holdMinutesInput,
    accessTokenInput,
    credentialConfigured: Boolean(credentials?.configured),
    credentialMasked: credentials?.masked || "",
    credentialMpUserId: credentials?.mpUserId || "",
    maxDepositAmount: MAX_DEPOSIT_AMOUNT,
    maxHoldMinutes: MAX_HOLD_MINUTES,
    isSavingSettings,
    isSavingCredential,
    isDeletingCredential,
    onToggleDepositEnabled: setDepositEnabledInput,
    onDepositAmountChange: setDepositAmountInput,
    onHoldMinutesChange: setHoldMinutesInput,
    onAccessTokenChange: setAccessTokenInput,
    onSaveSettings: handleSaveSettings,
    onSaveCredential: handleSaveCredential,
    onDeleteCredential: handleDeleteCredential,
    onLeaveView: handleLeaveView,
  };
};
