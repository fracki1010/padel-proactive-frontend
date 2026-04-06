import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { MapPin, Shield, User } from "lucide-react";

type CourtsAvailabilityProps = {
  courts: any[];
  filteredSlots: any[];
  isLoading: boolean;
  selectedDate: string;
  getSlotBookings: (slotId: string, courtId: string) => any[];
  onBookingClick: (booking: any) => void;
};

export const CourtsAvailability = ({
  courts,
  filteredSlots,
  isLoading,
  selectedDate,
  getSlotBookings,
  onBookingClick,
}: CourtsAvailabilityProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
        Turnos Disponibles
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner color="primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {courts.map((court: any) => (
            <div key={court._id} className="space-y-3">
              <div className="flex items-center gap-2 pl-1">
                <MapPin size={12} className="text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {court.name}
                </span>
              </div>
              {filteredSlots.map((slot: any) => {
                const slotBookings = getSlotBookings(slot._id, court._id);
                const activeBooking = slotBookings.find(
                  (booking: any) => booking.status !== "cancelado",
                );
                const cancelledBookings = slotBookings.filter(
                  (booking: any) => booking.status === "cancelado",
                );

                const isTaken = !!activeBooking && activeBooking.status !== "suspendido";
                const isSuspended = !!activeBooking && activeBooking.status === "suspendido";
                const isPast = new Date(selectedDate + "T23:59:59") < new Date();

                return (
                  <Card
                    key={`${court._id}-${slot._id}`}
                    className={`bg-dark-100 border transition-all ${
                      isTaken || (isPast && !isTaken) || isSuspended
                        ? "opacity-50 border-white/5 grayscale-[0.5]"
                        : "border-white/5 hover:border-primary/30"
                    } ${isSuspended ? "border-red-500/30 bg-red-500/5" : ""}`}
                  >
                    <CardBody className="p-4 flex flex-row items-center gap-4">
                      <div
                        className={`flex flex-col items-center min-w-[60px] p-2 bg-dark-200 rounded-2xl border ${isSuspended ? "border-red-500/20" : "border-white/5"}`}
                      >
                        <span
                          className={`text-lg font-black ${isSuspended ? "text-red-500" : "text-white"}`}
                        >
                          {slot.startTime}
                        </span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">
                          {parseInt(slot.startTime.split(":")[0]) < 12 ? "AM" : "PM"}
                        </span>
                      </div>

                      <div className="flex-grow">
                        <h4
                          className={`font-bold ${isTaken || (isPast && !isTaken) || isSuspended ? "line-through text-gray-500" : "text-white"}`}
                        >
                          {court.name}
                        </h4>
                        <p
                          className={`text-[10px] ${isSuspended ? "text-red-500/70" : "text-gray-500"} font-bold uppercase mt-0.5`}
                        >
                          {isSuspended ? "⚠️ TURNO SUSPENDIDO" : "90 mins"}
                        </p>
                        {isTaken && (
                          <div className="flex items-center gap-1 mt-1">
                            <User size={10} className="text-gray-600" />
                            <span className="text-[10px] text-gray-600 font-bold">
                              Res. por {activeBooking.clientName}
                            </span>
                          </div>
                        )}
                        {!isTaken && isPast && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              No disponible (Pasado)
                            </span>
                          </div>
                        )}
                        {!isTaken && !isSuspended && !isPast && cancelledBookings.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest">
                              ❌ Cancelado por {cancelledBookings[0].clientName}
                            </span>
                          </div>
                        )}
                      </div>

                      {isSuspended ? (
                        <Button
                          size="sm"
                          className="bg-red-500/20 text-red-500 font-black rounded-xl uppercase px-4 hover:bg-red-500/30"
                          onClick={() => onBookingClick(activeBooking)}
                        >
                          Habilitar
                        </Button>
                      ) : isTaken ? (
                        <Button
                          size="sm"
                          className="bg-dark-200 text-gray-500 font-black rounded-xl uppercase px-4 hover:bg-white/5"
                          onClick={() => onBookingClick(activeBooking)}
                        >
                          Detalles
                        </Button>
                      ) : isPast ? (
                        <Button
                          size="sm"
                          disabled
                          className="bg-dark-200 text-gray-400 font-black rounded-xl uppercase px-4 cursor-default"
                        >
                          Expirado
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            isIconOnly
                            variant="flat"
                            className="bg-white/5 text-gray-500 rounded-xl"
                            onClick={() =>
                              onBookingClick({
                                status: "suspendido",
                                court,
                                timeSlot: slot,
                                date: selectedDate,
                                clientName: "SISTEMA",
                                clientPhone: "MANTENIMIENTO",
                                finalPrice: 0,
                              })
                            }
                          >
                            <Shield size={16} />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-black font-black rounded-xl uppercase px-6 shadow-lg shadow-primary/20"
                            onClick={() =>
                              onBookingClick({
                                status: "disponible",
                                court,
                                timeSlot: slot,
                                date: selectedDate,
                              })
                            }
                          >
                            Reservar
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          ))}

          {filteredSlots.length === 0 && (
            <p className="text-center text-gray-600 py-10 font-bold italic">
              No se encontraron turnos para este horario.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
