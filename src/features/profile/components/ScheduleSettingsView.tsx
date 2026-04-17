import { Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import { ChevronLeft, Clock, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ScheduleSettingsViewProps = {
  slots: any[];
  newSlotStartTime: string;
  newSlotEndTime: string;
  newSlotPrice: string;
  basePriceInput: string;
  createSlotPending: boolean;
  updateBasePricePending: boolean;
  slotTogglePendingId: string | null;
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
  slotTogglePendingId,
  onBack,
  onSlotStartTimeChange,
  onSlotEndTimeChange,
  onSlotPriceChange,
  onBasePriceChange,
  onCreateSlot,
  onSaveBasePrice,
  onToggleSlot,
}: ScheduleSettingsViewProps) => {
  const MOBILE_SECTION_STORAGE_KEY = "padel_schedule_mobile_active_section";
  const [activeMobileSection, setActiveMobileSection] = useState<
    "create" | "configure" | "price"
  >(() => {
    if (typeof window === "undefined") return "create";
    const stored = window.localStorage.getItem(MOBILE_SECTION_STORAGE_KEY);
    return stored === "create" || stored === "configure" || stored === "price"
      ? stored
      : "create";
  });
  const createSectionRef = useRef<HTMLElement | null>(null);
  const configureSectionRef = useRef<HTMLElement | null>(null);
  const basePriceSectionRef = useRef<HTMLElement | null>(null);

  const parseHourToMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.MAX_SAFE_INTEGER;
    return hours * 60 + minutes;
  };

  const formatPrice = (value: unknown) => {
    const amount =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : Number.NaN;

    if (!Number.isFinite(amount)) return "$0";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sortedSlots = [...slots].sort((a, b) => {
    const startDiff = parseHourToMinutes(a.startTime) - parseHourToMinutes(b.startTime);
    if (startDiff !== 0) return startDiff;
    return parseHourToMinutes(a.endTime) - parseHourToMinutes(b.endTime);
  });

  const activeSlotsCount = sortedSlots.filter((slot) => slot.isActive).length;
  const goToSection = (ref: { current: HTMLElement | null }) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MOBILE_SECTION_STORAGE_KEY, activeMobileSection);
  }, [activeMobileSection, MOBILE_SECTION_STORAGE_KEY]);

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
          Horarios y Precios
        </h3>
      </div>

      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2rem] p-4 sm:p-5 flex flex-wrap gap-2">
        <Chip size="sm" className="bg-primary/20 text-primary font-bold border border-primary/30">
          {sortedSlots.length} turnos
        </Chip>
        <Chip size="sm" className="bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
          {activeSlotsCount} activos
        </Chip>
        <Chip size="sm" className="bg-black/10 dark:bg-white/10 text-foreground font-bold border border-black/10 dark:border-white/10">
          Ordenados por horario
        </Chip>
      </div>

      <section className="lg:hidden bg-dark-100 p-3 rounded-[2rem] border border-black/5 dark:border-white/5">
        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 px-2 pb-2">
          Secciones
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveMobileSection("create")}
            className={`h-10 rounded-xl border text-[10px] uppercase tracking-widest font-black transition-colors ${
              activeMobileSection === "create"
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400"
            }`}
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileSection("configure")}
            className={`h-10 rounded-xl border text-[10px] uppercase tracking-widest font-black transition-colors ${
              activeMobileSection === "configure"
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400"
            }`}
          >
            Configurar
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileSection("price")}
            className={`h-10 rounded-xl border text-[10px] uppercase tracking-widest font-black transition-colors ${
              activeMobileSection === "price"
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400"
            }`}
          >
            Precio
          </button>
        </div>
      </section>

      <section className="hidden lg:block bg-dark-100 p-3 rounded-[2rem] border border-black/5 dark:border-white/5">
        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 px-2 pb-2">
          Atajos de configuración
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => goToSection(createSectionRef)}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-left hover:border-primary/40 hover:bg-primary/10 transition-colors"
          >
            <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">1</p>
            <p className="text-sm font-black text-foreground uppercase">Crear turno</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Alta de horario</p>
          </button>
          <button
            type="button"
            onClick={() => goToSection(configureSectionRef)}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-left hover:border-primary/40 hover:bg-primary/10 transition-colors"
          >
            <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">2</p>
            <p className="text-sm font-black text-foreground uppercase">Configurar turnos</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Activar y desactivar</p>
          </button>
          <button
            type="button"
            onClick={() => goToSection(basePriceSectionRef)}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-left hover:border-primary/40 hover:bg-primary/10 transition-colors"
          >
            <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">3</p>
            <p className="text-sm font-black text-foreground uppercase">Precio base</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Tarifa global</p>
          </button>
        </div>
      </section>

      <section
        ref={createSectionRef}
        className={`space-y-3 scroll-mt-24 ${
          activeMobileSection === "create" ? "block" : "hidden"
        } lg:block`}
      >
        <div className="flex items-center gap-3 px-1">
          <Chip size="sm" className="bg-primary/20 text-primary border border-primary/30 font-black">
            1
          </Chip>
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500">Crear turno</p>
        </div>
        <div className="bg-dark-100 p-6 rounded-[2.5rem] border border-black/5 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              <p className="font-bold text-primary uppercase text-xs tracking-widest">
                Nuevo Horario
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
              Inicio - Fin - Precio
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="time"
              value={newSlotStartTime}
              onValueChange={onSlotStartTimeChange}
              placeholder="Inicio"
              classNames={{
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-foreground font-bold",
              }}
            />
            <Input
              type="time"
              value={newSlotEndTime}
              onValueChange={onSlotEndTimeChange}
              placeholder="Fin"
              classNames={{
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-foreground font-bold",
              }}
            />
            <Input
              type="number"
              value={newSlotPrice}
              onValueChange={onSlotPriceChange}
              placeholder="Precio"
              classNames={{
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-foreground font-bold",
              }}
            />
          </div>
          <Button
            className="h-12 bg-primary text-black font-black rounded-2xl uppercase text-[10px] w-full sm:w-auto px-8"
            onPress={onCreateSlot}
            isLoading={createSlotPending}
          >
            Añadir Turno
          </Button>
        </div>
      </section>

      <section
        ref={configureSectionRef}
        className={`space-y-3 scroll-mt-24 ${
          activeMobileSection === "configure" ? "block" : "hidden"
        } lg:block`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <Chip size="sm" className="bg-primary/20 text-primary border border-primary/30 font-black">
              2
            </Chip>
            <p className="text-xs uppercase tracking-widest font-bold text-gray-500">
              Configurar turnos
            </p>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500">
            Activar / desactivar
          </p>
        </div>
        {sortedSlots.length === 0 ? (
          <Card className="bg-dark-100 border border-dashed border-black/15 dark:border-white/15 rounded-[2rem]">
            <CardBody className="p-8 text-center">
              <p className="font-bold text-foreground">Todavía no hay turnos creados.</p>
              <p className="text-sm text-gray-500 mt-1">
                Cargá el primer horario para empezar a tomar reservas.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {sortedSlots.map((slot: any) => (
            <Card
              key={slot._id}
              className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-[2rem]"
            >
              <CardBody className="p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 ${slot.isActive ? "bg-primary/10 text-primary" : "bg-black/5 dark:bg-white/5 text-gray-500"} rounded-2xl flex items-center justify-center`}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                      {formatPrice(slot.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {slotTogglePendingId === slot._id ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                      <Loader2 size={13} className="animate-spin" />
                      Guardando
                    </div>
                  ) : null}
                  <Switch
                    isSelected={slot.isActive}
                    onValueChange={(value) => onToggleSlot(slot._id, value)}
                    color="primary"
                    size="sm"
                    isDisabled={slotTogglePendingId === slot._id}
                  />
                </div>
              </CardBody>
            </Card>
            ))}
          </div>
        )}
      </section>

      <section
        ref={basePriceSectionRef}
        className={`space-y-3 scroll-mt-24 ${
          activeMobileSection === "price" ? "block" : "hidden"
        } lg:block`}
      >
        <div className="flex items-center gap-3 px-1">
          <Chip size="sm" className="bg-primary/20 text-primary border border-primary/30 font-black">
            3
          </Chip>
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500">Precio base</p>
        </div>
        <div className="bg-primary/10 p-6 rounded-[2.5rem] border border-primary/20 space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="text-primary" size={20} />
            <p className="font-bold text-primary uppercase text-xs tracking-widest">
              Precio Base Global
            </p>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
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
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-foreground font-bold",
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
          <p className="text-[11px] text-gray-400">
            Valor actual: <span className="font-bold text-foreground">{formatPrice(basePriceInput || 0)}</span>
          </p>
        </div>
      </section>
    </div>
  );
};
