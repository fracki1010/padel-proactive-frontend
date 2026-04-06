import {
  Avatar,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";
import type { Booking, User } from "../../../types";

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  history: Booking[];
  isLoading: boolean;
};

export const HistoryModal = ({
  isOpen,
  onClose,
  user,
  history,
  isLoading,
}: HistoryModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      className="bg-dark-300 text-white"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={getInitials(user?.name || "")}
              className="w-12 h-12 rounded-2xl"
              style={{ backgroundColor: getAvatarColor(user?.name || "") }}
            />
            <div>
              <h2 className="text-xl font-black">Historial de {user?.name}</h2>
              <p className="text-xs text-gray-500 font-normal">
                Registro completo de turnos y pagos
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="py-6 px-4">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Spinner color="primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-dark-200 rounded-3xl border border-white/5">
              <Info size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-500">
                Este socio aún no tiene actividad registrada.
              </p>
            </div>
          ) : (
            <ScrollShadow className="max-h-[500px] pr-2">
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="bg-dark-200/50 p-4 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-white/5 p-2 rounded-2xl flex flex-col items-center min-w-[55px] font-black">
                          <span className="text-[10px] text-primary uppercase">
                            {format(new Date(item.date), "EEE", { locale: es })}
                          </span>
                          <span className="text-lg">
                            {format(new Date(item.date), "dd")}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                            {format(new Date(item.date), "MMMM yyyy", {
                              locale: es,
                            })}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <Clock size={14} className="text-primary" />
                              {item.timeSlot?.startTime}
                            </div>
                            <div className="h-3 w-[1px] bg-white/10 hidden sm:block" />
                            <p className="text-sm font-medium text-gray-300">
                              {item.court?.name || "Mantenimiento"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                        <Chip
                          size="sm"
                          variant="flat"
                          className="font-black text-[10px] h-6 px-3"
                          color={
                            item.status === "cancelado"
                              ? "danger"
                              : item.status === "confirmado"
                                ? "success"
                                : item.status === "suspendido"
                                  ? "warning"
                                  : "default"
                          }
                        >
                          {item.status.toUpperCase()}
                        </Chip>
                        <p className="text-xl font-black text-white">
                          <span className="text-xs text-primary mr-1">$</span>
                          {item.finalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollShadow>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
