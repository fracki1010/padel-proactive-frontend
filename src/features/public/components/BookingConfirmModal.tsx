import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { Clock, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useCreateBooking, useRegeneratePaymentLink } from "../hooks/usePortalMutations";
import { formatCountdown } from "../../../utils/formatters";
import { openPaymentLink } from "../../../utils/openPaymentLink";

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  label?: string;
}

interface Court {
  _id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  court: Court | null;
  slot: Slot | null;
  date: string;
  clientName: string;
  holderId?: string;
  onConfirmed: () => void;
  onConflict?: () => void;
  // Notifies the portal of a live deposit hold so the payment link stays
  // reachable after the modal closes (mid-flight disable must not strand it).
  onDepositPending?: (info: {
    bookingId: string;
    amount: number;
    link: string;
    expiresAt: string | null;
  }) => void;
  // Keeps the portal banner's link in sync when it is refreshed here.
  onDepositLinkChange?: (link: string) => void;
}

interface PendingPayment {
  bookingId: string;
  amount: number;
  link: string;
  expiresAt: string | null;
  courtName: string;
  slotLabel: string;
  dateLabel: string;
}

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const BookingConfirmModal = ({
  isOpen,
  onClose,
  slug,
  court,
  slot,
  date,
  clientName,
  holderId,
  onConfirmed,
  onConflict,
  onDepositPending,
  onDepositLinkChange,
}: Props) => {
  const createBooking = useCreateBooking(slug);
  const regeneratePaymentLink = useRegeneratePaymentLink(slug);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  // Set when the backend rejects the hold as already expired (409).
  const [expiredLocally, setExpiredLocally] = useState(false);

  // The modal is blocked while a mutation is in flight.
  const isLoading = createBooking.isPending;
  const isRegenerating = regeneratePaymentLink.isPending;

  // Clear the payment step whenever the modal is dismissed, so a fresh open
  // always starts from the confirmation step.
  useEffect(() => {
    if (!isOpen) {
      setPending(null);
      setSecondsLeft(null);
      setExpiredLocally(false);
    }
  }, [isOpen]);

  // Countdown for the deposit hold. When it reaches zero the link can no
  // longer be honoured (the sweeper frees the court).
  useEffect(() => {
    if (!pending?.expiresAt) {
      setSecondsLeft(null);
      return;
    }
    const target = new Date(pending.expiresAt).getTime();
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pending?.expiresAt]);

  // Derive the remaining time from `expiresAt` on first render so we never
  // flash `0:00:00` before the interval effect runs.
  const holdSeconds = pending?.expiresAt
    ? Math.max(0, Math.round((new Date(pending.expiresAt).getTime() - Date.now()) / 1000))
    : null;
  const shownSeconds = secondsLeft ?? holdSeconds;
  const isExpired =
    Boolean(pending) &&
    (expiredLocally ||
      (Boolean(pending?.expiresAt) && shownSeconds !== null && shownSeconds <= 0));

  const handleClose = () => {
    if (isLoading || isRegenerating) return;
    setPending(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!court || !slot || !date) return;
    try {
      const res = await createBooking.mutateAsync({
        courtId: court._id,
        slotId: slot._id,
        date,
        ...(holderId ? { holderId } : {}),
      });
      const data = res.data;
      const deposit = data?.deposit;

      // Deposit required: hold the slot open and show the payment step instead
      // of closing. Non-deposit clubs keep the exact previous behaviour.
      if (deposit?.required && Number(deposit.amount) > 0 && deposit.status === "pendiente") {
        const link = data?.payment?.initPoint || "";
        setExpiredLocally(false);
        setPending({
          bookingId: data._id,
          amount: Number(deposit.amount),
          link,
          expiresAt: deposit.expiresAt ?? null,
          courtName: court.name,
          slotLabel: slot.label || `${slot.startTime} - ${slot.endTime}`,
          dateLabel: formatDate(date),
        });
        onDepositPending?.({
          bookingId: data._id,
          amount: Number(deposit.amount),
          link,
          expiresAt: deposit.expiresAt ?? null,
        });
        addToast({
          title: "Turno retenido. Pagá la seña para confirmarlo",
          color: "warning",
        });
        onConfirmed();
        return;
      }

      addToast({ title: "Turno reservado con éxito", color: "success" });
      onConfirmed();
      onClose();
    } catch (err: unknown) {
      console.error("[BookingConfirmModal] Error al crear reserva:", err);
      const response = (err as { response?: { status?: number; data?: unknown } })?.response;
      const status = response?.status;
      const data = response?.data as { error?: string } | string | undefined;
      const message = typeof data === "string"
        ? "No se pudo reservar el turno"
        : data?.error || "No se pudo reservar el turno";
      addToast({ title: message, color: "danger" });
      if (status === 409) {
        onClose();
        onConflict?.();
      }
    }
  };

  const handlePay = () => {
    if (!pending?.link || isExpired) return;
    void openPaymentLink(pending.link);
  };

  const handleCopy = async () => {
    if (!pending?.link) return;
    try {
      await navigator.clipboard.writeText(pending.link);
      addToast({ title: "Link de pago copiado", color: "success" });
    } catch {
      addToast({ title: "No se pudo copiar el link", color: "danger" });
    }
  };

  const handleRegenerate = async () => {
    if (!pending) return;
    try {
      const res = await regeneratePaymentLink.mutateAsync(pending.bookingId);
      const link = res.data?.initPoint;
      if (!link) throw new Error("empty payment link");
      setPending((prev) => (prev ? { ...prev, link } : prev));
      // Keep the portal banner showing the freshest URL.
      onDepositLinkChange?.(link);
      addToast({ title: "Link de pago actualizado", color: "success" });
    } catch (err: unknown) {
      const response = (err as {
        response?: { status?: number; data?: { error?: string; code?: string } };
      })?.response;
      const code = response?.data?.code;
      if (code === "DEPOSIT_EXPIRED") {
        // Reflect the true state locally: disable pay/regenerate.
        setExpiredLocally(true);
      }
      const message = code === "DEPOSIT_EXPIRED"
        ? "La seña venció; el turno ya no admite pago"
        : code === "DEPOSIT_NOT_CONFIGURED"
          ? "El club no tiene el pago de seña disponible en este momento"
          : response?.data?.error || "No se pudo generar el link de pago. Intentá nuevamente.";
      addToast({ title: message, color: "danger" });
    }
  };

  if (!pending && (!court || !slot)) return null;

  const hasLink = Boolean(pending?.link);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      placement="center"
      size="sm"
      isDismissable={!isLoading && !isRegenerating}
      hideCloseButton={isLoading}
    >
      <ModalContent>
        {pending ? (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Clock size={18} className="text-warning" />
              Pagá la seña
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 p-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-default-500">Seña a pagar</span>
                    <span className="font-black text-warning-600 dark:text-warning-400">
                      ${pending.amount.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Cancha</span>
                    <span className="font-semibold">{pending.courtName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Horario</span>
                    <span className="font-semibold">{pending.slotLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Fecha</span>
                    <span className="font-semibold capitalize">{pending.dateLabel}</span>
                  </div>
                </div>

                {pending.expiresAt && (
                  <p
                    aria-live="polite"
                    className={`text-xs text-center font-semibold ${
                      isExpired ? "text-danger" : "text-warning-600 dark:text-warning-400"
                    }`}
                  >
                    {isExpired
                      ? "El plazo para pagar la seña venció; el turno se libera automáticamente."
                      : shownSeconds === null
                        ? "Calculando tiempo restante…"
                        : `Tenés ${formatCountdown(shownSeconds)} para completar el pago.`}
                  </p>
                )}

                <p className="text-xs text-default-400 text-center">
                  El pago se realiza en MercadoPago. La seña se descuenta del precio del turno
                  y queda sujeta a la política de cancelación del club.
                </p>

                {pending.link && (
                  <div className="flex items-center gap-2 rounded-lg border border-default-200 bg-default-100 px-3 py-2">
                    <span className="text-xs text-default-500 truncate flex-1">{pending.link}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleCopy}
                      aria-label="Copiar link de pago"
                      title="Copiar link de pago"
                    >
                      <Copy size={15} />
                    </Button>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="flex-col gap-2">
              {!isExpired && (
                <Button
                  color="primary"
                  className="w-full font-bold"
                  startContent={hasLink ? <ExternalLink size={16} /> : <RefreshCw size={16} />}
                  onPress={hasLink ? handlePay : handleRegenerate}
                  isLoading={isRegenerating && !hasLink}
                >
                  {hasLink ? "Pagar seña" : "Generar link de pago"}
                </Button>
              )}
              {!isExpired && hasLink && (
                <Button
                  variant="flat"
                  className="w-full"
                  startContent={<RefreshCw size={15} />}
                  onPress={handleRegenerate}
                  isLoading={isRegenerating}
                >
                  Re-generar link
                </Button>
              )}
              <Button variant="light" className="w-full" onPress={handleClose}>
                Cerrar
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader>Confirmar reserva</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-default-100 p-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-default-500">Cancha</span>
                    <span className="font-semibold">{court?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Horario</span>
                    <span className="font-semibold">
                      {slot?.label || `${slot?.startTime} - ${slot?.endTime}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Fecha</span>
                    <span className="font-semibold capitalize">{formatDate(date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Precio</span>
                    <span className="font-semibold text-primary">
                      {(slot?.price ?? 0) > 0 ? `$${slot?.price.toLocaleString("es-AR")}` : "A convenir"}
                    </span>
                  </div>
                  <hr className="border-default-200" />
                  <div className="flex justify-between">
                    <span className="text-default-500">A nombre de</span>
                    <span className="font-semibold">{clientName}</span>
                  </div>
                </div>
                <p className="text-xs text-default-400 text-center">
                  El pago se abona en el club. Estado inicial: pendiente.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleConfirm} isLoading={isLoading}>
                Confirmar reserva
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
