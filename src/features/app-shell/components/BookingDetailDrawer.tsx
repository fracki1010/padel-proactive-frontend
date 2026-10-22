import {
  Avatar,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  addToast,
  Chip,
} from "@heroui/react";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useState } from "react";

import { useConfirmDepositReceived, useSetBookingAttendance } from "../../bookings/hooks/useBookingsData";
import { resolveAttendanceDisplay } from "../../../utils/attendance";
import {
  MOBILE_DRAWER_CONTENT,
  MOBILE_DRAWER_MAX_HEIGHT,
} from "../../../components/ui/drawerClasses";
import { getInitials, getAvatarColor } from "../../../utils/avatarUtils";
import { formatCurrency, formatDate, formatPhoneForDisplay } from "../../../utils/formatters";

type BookingDetailDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedBooking: any;
  setSelectedBooking: (booking: any) => void;
  updateBooking: any;
  deleteBooking: any;
  isDesktop?: boolean;
};

export const BookingDetailDrawer = ({
  isOpen,
  onOpenChange,
  selectedBooking,
  setSelectedBooking,
  updateBooking,
  deleteBooking,
  isDesktop = false,
}: BookingDetailDrawerProps) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [applyPenalty, setApplyPenalty] = useState(true);

  // A transfer seña pending: the admin marks it received and the booking is
  // confirmed (same client confirmation as a MercadoPago approval).
  const confirmDepositReceived = useConfirmDepositReceived();
  const setAttendance = useSetBookingAttendance();
  const isTransferSeñaPending =
    selectedBooking?.status === "pendiente_seña" &&
    selectedBooking?.deposit?.method === "transfer";

  const handleAttendance = (status: "attended" | "absent" | "unmarked") => {
    if (!selectedBooking?._id) return;
    setAttendance.mutate(
      { id: selectedBooking._id, status },
      {
        onSuccess: (response: { data?: unknown }) => {
          if (response?.data) setSelectedBooking(response.data);
          addToast({
            title:
              status === "attended"
                ? "Marcado como asistió"
                : status === "absent"
                  ? "Marcado como no asistió"
                  : "Asistencia sin marcar",
            color: "success",
          });
        },
        onError: () => {
          addToast({ title: "No se pudo actualizar la asistencia", color: "danger" });
        },
      },
    );
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        size={isDesktop ? "2xl" : "3xl"}
        hideCloseButton
        onOpenChange={onOpenChange}
        placement={isDesktop ? "right" : "bottom"}
        backdrop="blur"
        classNames={{
          base: isDesktop
            ? "bg-surface-container-high border-l border-black/10 dark:border-white/10"
            : `${MOBILE_DRAWER_MAX_HEIGHT} rounded-t-[3rem] bg-surface-container-high border-t border-black/10 dark:border-white/10`,
        }}
      >
        <DrawerContent className={isDesktop ? "" : MOBILE_DRAWER_CONTENT}>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 p-5 sm:p-8 text-center">
                <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-6" />
                <h2 className="text-3xl font-black text-foreground italic tracking-tighter uppercase">
                  Detalles del Turno
                </h2>
              </DrawerHeader>
              <DrawerBody className="p-4 sm:p-8 pb-10 sm:pb-12 space-y-6 sm:space-y-8">
                <div className="flex gap-4 p-4 bg-dark-100 rounded-md border border-black/5 dark:border-white/5 items-center">
                  <Avatar
                    name={getInitials(selectedBooking?.clientName)}
                    className="w-20 h-20 rounded-md shadow-xl shadow-black/40 text-2xl font-black text-foreground"
                    style={{
                      backgroundColor: getAvatarColor(selectedBooking?.clientName),
                    }}
                  />
                  <div>
                    <h3 className="text-2xl font-black text-foreground leading-tight">
                      {selectedBooking?.clientName}
                    </h3>
                    <p className="text-primary font-bold flex items-center gap-2 mt-1">
                      <Phone size={14} /> {formatPhoneForDisplay(selectedBooking?.clientPhone)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-dark-100 rounded-md border border-black/5 dark:border-white/5 flex flex-col gap-1">
                    <Calendar size={18} className="text-on-surface-variant mb-1" />
                    <span className="text-[10px] text-on-surface-variant font-black uppercase">
                      FECHA
                    </span>
                    <span className="text-foreground font-bold">
                      {selectedBooking && formatDate(selectedBooking.date)}
                    </span>
                  </div>
                  <div className="p-4 bg-dark-100 rounded-md border border-black/5 dark:border-white/5 flex flex-col gap-1">
                    <Clock size={18} className="text-on-surface-variant mb-1" />
                    <span className="text-[10px] text-on-surface-variant font-black uppercase">
                      HORARIO
                    </span>
                    <span className="text-foreground font-bold">
                      {selectedBooking?.timeSlot?.startTime} - {selectedBooking?.timeSlot?.endTime}
                    </span>
                  </div>
                  <div className="p-4 bg-dark-100 rounded-md border border-black/5 dark:border-white/5 flex flex-col gap-1 sm:col-span-2">
                    <MapPin size={18} className="text-on-surface-variant mb-1" />
                    <span className="text-[10px] text-on-surface-variant font-black uppercase">
                      CANCHA
                    </span>
                    <span className="text-foreground font-bold">
                      {selectedBooking?.court?.name}
                    </span>
                  </div>

                  {/* Asistencia real del turno (marcada por el club) */}
                  <div className="p-4 bg-dark-100 rounded-md border border-black/5 dark:border-white/5 flex flex-col gap-3 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-on-surface-variant font-black uppercase block">
                          Asistencia
                        </span>
                        <span className="font-bold text-foreground">
                          {resolveAttendanceDisplay(selectedBooking).label}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          isDisabled={setAttendance.isPending}
                          onPress={() => handleAttendance("attended")}
                        >
                          Asistió
                        </Button>
                        <Button
                          size="sm"
                          className="font-bold bg-red-500/15 text-red-300 border border-red-500/30"
                          isDisabled={setAttendance.isPending}
                          onPress={() => handleAttendance("absent")}
                        >
                          No asistió
                        </Button>
                      </div>
                    </div>

                    {Number(selectedBooking?.deposit?.amount || 0) > 0 && (
                      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                        <div>
                          <span className="text-[10px] text-on-surface-variant font-black uppercase block">
                            Seña
                          </span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(Number(selectedBooking?.deposit?.amount) || 0)}
                          </span>
                        </div>
                        <Chip
                          size="sm"
                          className={`font-black uppercase ${
                            selectedBooking?.deposit?.status === "pagado"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : selectedBooking?.deposit?.status === "pendiente"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-black/5 dark:bg-white/10 text-on-surface-variant border border-black/10 dark:border-white/10"
                          }`}
                        >
                          {selectedBooking?.deposit?.status === "pagado"
                            ? "Pagada"
                            : selectedBooking?.deposit?.status === "pendiente"
                              ? "Pendiente"
                              : selectedBooking?.deposit?.status === "expirado"
                                ? "Vencida"
                                : selectedBooking?.deposit?.status === "reembolsado"
                                  ? "Reembolsada"
                                  : "—"}
                        </Chip>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {isTransferSeñaPending ? (
                    <Button
                      className="h-16 bg-emerald-500 text-white font-black text-lg rounded-md shadow-xl shadow-emerald-500/20"
                      isLoading={confirmDepositReceived.isPending}
                      isDisabled={updateBooking.isPending || deleteBooking.isPending}
                      onPress={() => {
                        confirmDepositReceived.mutate(selectedBooking._id, {
                          onSuccess: (response: {
                            success?: boolean;
                            data?: unknown;
                          }) => {
                            setSelectedBooking(response.data);
                            addToast({
                              title: "Seña recibida: turno confirmado",
                              color: "success",
                            });
                            onOpenChange(false);
                          },
                          onError: (err: unknown) => {
                            addToast({
                              title:
                                (
                                  err as {
                                    response?: { data?: { error?: string } };
                                  } | null
                                )?.response?.data?.error ||
                                "No se pudo confirmar la seña",
                              color: "danger",
                            });
                          },
                        });
                      }}
                      startContent={<BadgeCheck size={20} />}
                    >
                      SEÑA RECIBIDA
                    </Button>
                  ) : null}
                  {selectedBooking?.status === "suspendido" ? (
                    <Button
                      className="h-16 bg-red-500 text-white font-black text-lg rounded-md shadow-xl shadow-red-500/20"
                      isLoading={deleteBooking.isPending}
                      isDisabled={updateBooking.isPending}
                      onPress={() => {
                        deleteBooking.mutate(selectedBooking._id, {
                          onSuccess: () => {
                            addToast({
                              title: "Turno liberado correctamente",
                              color: "success",
                            });
                            onOpenChange(false);
                          },
                          onError: () => {
                            addToast({
                              title: "Error al liberar turno",
                              color: "danger",
                            });
                          },
                        });
                      }}
                    >
                      HABILITAR TURNO
                    </Button>
                  ) : (
                    <Button
                      className="h-16 bg-primary text-black dark:text-white font-black text-lg rounded-md shadow-xl shadow-primary/20"
                      onPress={() =>
                        window.open(
                          `https://wa.me/${selectedBooking?.clientPhone.replace(/\D/g, "")}`,
                          "_blank",
                        )
                      }
                    >
                      <MessageSquare size={20} /> ENVIAR WHATSAPP
                    </Button>
                  )}

                  {selectedBooking?.status !== "suspendido" &&
                  selectedBooking?.status !== "cancelado" ? (
                    <Button
                      className="h-16 bg-red-500/90 text-white font-black text-lg rounded-md"
                      onPress={() => {
                        setApplyPenalty(true);
                        setIsCancelModalOpen(true);
                      }}
                      isDisabled={updateBooking.isPending || deleteBooking.isPending}
                      isLoading={updateBooking.isPending}
                    >
                      CANCELAR TURNO
                    </Button>
                  ) : null}

                  <Button
                    variant="flat"
                    className="h-16 text-foreground bg-black/5 dark:bg-white/5 rounded-md font-bold"
                    isDisabled={updateBooking.isPending || deleteBooking.isPending}
                    onPress={() => {
                      onClose();
                      onOpenChange(false);
                    }}
                  >
                    Cerrar Detalle
                  </Button>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Modal
        isOpen={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        placement="center"
        backdrop="blur"
        className="bg-surface-container-high text-foreground"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                Confirmar cancelación
              </ModalHeader>
              <ModalBody className="space-y-4">
                <p className="text-sm text-on-surface-variant">
                  ¿Querés cancelar este turno y aplicar penalización al cliente?
                </p>
                <div className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Aplicar penalización
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Si está activo, suma 1 penalización al cliente.
                    </p>
                  </div>
                  <Switch
                    isSelected={applyPenalty}
                    onValueChange={setApplyPenalty}
                    color="warning"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  className="rounded-xl font-bold"
                >
                  Volver
                </Button>
                <Button
                  color="danger"
                  className="rounded-xl font-black"
                  isLoading={updateBooking.isPending}
                  onPress={() => {
                    updateBooking.mutate(
                      {
                        id: selectedBooking._id,
                        data: { status: "cancelado", applyPenalty },
                      },
                      {
                        onSuccess: (response: any) => {
                          const penalty = response?.penalty;
                          if (applyPenalty && penalty?.applied) {
                            addToast({
                              title: `Turno cancelado y penalización aplicada (${penalty.penalties}/${penalty.penaltyLimit})`,
                              color: "warning",
                            });
                          } else if (applyPenalty && !penalty?.applied) {
                            addToast({
                              title: "Turno cancelado (sin penalización: cliente no encontrado)",
                              color: "warning",
                            });
                          } else {
                            addToast({
                              title: "Turno cancelado sin penalización",
                              color: "success",
                            });
                          }

                          setSelectedBooking(response.data);
                          onClose();
                          onOpenChange(false);
                        },
                        onError: () => {
                          addToast({
                            title: "Error al cancelar turno",
                            color: "danger",
                          });
                        },
                      },
                    );
                  }}
                >
                  Confirmar cancelación
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
