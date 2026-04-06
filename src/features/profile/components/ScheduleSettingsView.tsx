import { Button, Card, CardBody, Input, Switch } from "@heroui/react";
import { ChevronLeft, Clock, CreditCard, Shield } from "lucide-react";

type ScheduleSettingsViewProps = {
  slots: any[];
  newSlotStartTime: string;
  newSlotEndTime: string;
  newSlotPrice: string;
  basePriceInput: string;
  createSlotPending: boolean;
  updateBasePricePending: boolean;
  onBack: () => void;
  onSlotStartTimeChange: (value: string) => void;
  onSlotEndTimeChange: (value: string) => void;
  onSlotPriceChange: (value: string) => void;
  onBasePriceChange: (value: string) => void;
  onCreateSlot: () => void;
  onSaveBasePrice: () => void;
  onToggleSlot: (id: string, isActive: boolean) => void;
};

export const ScheduleSettingsView = ({
  slots,
  newSlotStartTime,
  newSlotEndTime,
  newSlotPrice,
  basePriceInput,
  createSlotPending,
  updateBasePricePending,
  onBack,
  onSlotStartTimeChange,
  onSlotEndTimeChange,
  onSlotPriceChange,
  onBasePriceChange,
  onCreateSlot,
  onSaveBasePrice,
  onToggleSlot,
}: ScheduleSettingsViewProps) => {
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
          Horarios y Precios
        </h3>
      </div>

      <div className="space-y-4">
        <section className="bg-dark-100 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="text-primary" size={20} />
            <p className="font-bold text-primary uppercase text-xs tracking-widest">
              Crear Turno
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              type="time"
              value={newSlotStartTime}
              onValueChange={onSlotStartTimeChange}
              placeholder="Inicio"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
            <Input
              type="time"
              value={newSlotEndTime}
              onValueChange={onSlotEndTimeChange}
              placeholder="Fin"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
            <Input
              type="number"
              value={newSlotPrice}
              onValueChange={onSlotPriceChange}
              placeholder="Precio"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
          </div>
          <Button
            className="h-12 bg-primary text-black font-black rounded-2xl uppercase text-[10px] w-full sm:w-auto"
            onPress={onCreateSlot}
            isLoading={createSlotPending}
          >
            Añadir Turno
          </Button>
        </section>

        <section className="bg-primary/10 p-6 rounded-[2.5rem] border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="text-primary" size={20} />
            <p className="font-bold text-primary uppercase text-xs tracking-widest">
              Precio Base Global
            </p>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 leading-relaxed">
            Este valor se aplica a todos los turnos y reemplaza cualquier precio por horario.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={basePriceInput}
              onValueChange={onBasePriceChange}
              placeholder="Ej: 12000"
              type="number"
              className="flex-grow"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
            <Button
              className="h-12 bg-primary text-black font-black rounded-2xl uppercase text-[10px] w-full sm:w-auto"
              onPress={onSaveBasePrice}
              isLoading={updateBasePricePending}
            >
              Guardar Base
            </Button>
          </div>
        </section>

        <section className="bg-blue-500/10 p-6 rounded-[2.5rem] border border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-blue-500" size={20} />
            <p className="font-bold text-blue-500 uppercase text-xs tracking-widest">
              Suspensión de Emergencia
            </p>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 leading-relaxed">
            Bloquea turnos específicos por lluvia o mantenimiento técnico.
          </p>
          <Button
            fullWidth
            variant="flat"
            className="bg-blue-500 text-white font-black rounded-2xl uppercase text-[10px]"
            startContent={<Clock size={14} />}
          >
            Gestionar Bloqueos
          </Button>
        </section>

        <div className="space-y-3">
          {slots.map((slot: any) => (
            <Card
              key={slot._id}
              className="bg-dark-100 border border-white/5 rounded-[2rem]"
            >
              <CardBody className="p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 ${slot.isActive ? "bg-primary/10 text-primary" : "bg-white/5 text-gray-500"} rounded-2xl flex items-center justify-center`}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                      ${slot.price}
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={slot.isActive}
                  onValueChange={(value) => onToggleSlot(slot._id, value)}
                  color="primary"
                  size="sm"
                />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
