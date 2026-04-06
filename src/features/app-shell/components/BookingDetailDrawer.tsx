import {
  Avatar,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Switch,
  addToast,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";

import { getInitials, getAvatarColor } from "../../../utils/avatarUtils";
import { formatDate } from "../../../utils/formatters";

type BookingDetailDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedBooking: any;
  setSelectedBooking: (booking: any) => void;
  updateBooking: any;
  deleteBooking: any;
};

export const BookingDetailDrawer = ({
  isOpen,
  onOpenChange,
  selectedBooking,
  setSelectedBooking,
  updateBooking,
  deleteBooking,
}: BookingDetailDrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      size="3xl"
      hideCloseButton
      onOpenChange={onOpenChange}
      placement="bottom"
      backdrop="blur"
      classNames={{
        base: "rounded-t-[3rem] bg-dark-200 border-t border-white/10",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1 p-5 sm:p-8 text-center">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                Detalles del Turno
              </h2>
            </DrawerHeader>
            <DrawerBody className="p-4 sm:p-8 pb-10 sm:pb-12 space-y-6 sm:space-y-8">
              <div className="flex gap-4 p-4 bg-dark-100 rounded-3xl border border-white/5 items-center">
                <Avatar
                  name={getInitials(selectedBooking?.clientName)}
                  className="w-20 h-20 rounded-2xl shadow-xl shadow-black/40 text-2xl font-black text-white"
                  style={{
                    backgroundColor: getAvatarColor(selectedBooking?.clientName),
                  }}
                />
                <div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {selectedBooking?.clientName}
                  </h3>
                  <p className="text-primary font-bold flex items-center gap-2 mt-1">
                    <Phone size={14} /> {selectedBooking?.clientPhone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-100 rounded-3xl border border-white/5 flex flex-col gap-1">
                  <Calendar size={18} className="text-gray-500 mb-1" />
                  <span className="text-[10px] text-gray-500 font-black uppercase">
                    FECHA
                  </span>
                  <span className="text-white font-bold">
                    {selectedBooking && formatDate(selectedBooking.date)}
                  </span>
                </div>
                <div className="p-4 bg-dark-100 rounded-3xl border border-white/5 flex flex-col gap-1">
                  <Clock size={18} className="text-gray-500 mb-1" />
                  <span className="text-[10px] text-gray-500 font-black uppercase">
                    HORARIO
                  </span>
                  <span className="text-white font-bold">
                    {selectedBooking?.timeSlot?.startTime} - {selectedBooking?.timeSlot?.endTime}
                  </span>
                </div>
                <div className="p-4 bg-dark-100 rounded-3xl border border-white/5 flex flex-col gap-1 sm:col-span-2">
                  <MapPin size={18} className="text-gray-500 mb-1" />
                  <span className="text-[10px] text-gray-500 font-black uppercase">
                    CANCHA
                  </span>
                  <span className="text-white font-bold">
                    {selectedBooking?.court?.name}
                  </span>
                </div>

                <div className="p-4 bg-dark-100 rounded-3xl border border-white/5 flex items-center justify-between sm:col-span-2">
                  <div className="flex gap-4 items-center">
                    <div
                      className={`w-12 h-12 ${selectedBooking?.paymentStatus === "pagado" ? "bg-primary/10 text-primary" : "bg-white/5 text-gray-500"} rounded-2xl flex items-center justify-center`}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-black uppercase block">
                        PAGO
                      </span>
                      <span
                        className={`font-bold ${selectedBooking?.paymentStatus === "pagado" ? "text-primary" : "text-white"}`}
                      >
                        {selectedBooking?.paymentStatus === "pagado" ? "COBRADO" : "PENDIENTE"}
                      </span>
                    </div>
                  </div>
                  <Switch
                    isSelected={selectedBooking?.paymentStatus === "pagado"}
                    onValueChange={(value) => {
                      const newStatus = value ? "pagado" : "pendiente";
                      updateBooking.mutate(
                        {
                          id: selectedBooking._id,
                          data: { paymentStatus: newStatus },
                        },
                        {
                          onSuccess: (response: any) => {
                            setSelectedBooking(response.data);
                            addToast({
                              title: "Estado de pago actualizado",
                              color: "success",
                            });
                          },
                          onError: () => {
                            addToast({
                              title: "Error al actualizar estado",
                              color: "danger",
                            });
                          },
                        },
                      );
                    }}
                    color="primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {selectedBooking?.status === "suspendido" ? (
                  <Button
                    className="h-16 bg-red-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-500/20"
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
                    className="h-16 bg-primary text-black font-black text-lg rounded-2xl shadow-xl shadow-primary/20"
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
                <Button
                  variant="flat"
                  className="h-16 text-white bg-white/5 rounded-2xl font-bold"
                  onPress={onClose}
                >
                  Cerrar Detalle
                </Button>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
