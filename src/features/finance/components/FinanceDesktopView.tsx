import { Button, Chip } from "@heroui/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreVertical,
  Scale,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatCurrency, toIsoDateKey } from "../../../utils/formatters";

type FinanceDesktopViewProps = {
  months: string[];
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  metrics: {
    totalMonth: number;
    totalPaidMonth: number;
    totalPaidDaily: number;
    countPendingMonth: number;
    countConfirmedMonth: number;
    avgPrice: number;
    movements: any[];
  };
};

const barHeights = [18, 34, 50, 28, 54, 68, 58];

export const FinanceDesktopView = ({
  months,
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  metrics,
}: FinanceDesktopViewProps) => {
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(metrics.movements.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, metrics.movements.length]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return metrics.movements.slice(start, start + PAGE_SIZE);
  }, [metrics.movements, currentPage]);

  const exportCsv = () => {
    const rows = [
      ["cliente", "concepto", "fecha", "hora", "monto", "estado_pago"],
      ...metrics.movements.map((movement) => [
        movement.clientName || "-",
        movement.court?.name
          ? `Alquiler ${movement.court.name}`
          : movement.status === "suspendido"
            ? "Bloqueo por mantenimiento"
            : "Reserva",
        toIsoDateKey(movement.date),
        movement.timeSlot?.startTime || "--:--",
        String(Number(movement.finalPrice) || 0),
        movement.paymentStatus || "pendiente",
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `caja-${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hidden lg:block animate-in fade-in duration-500">
      <div className="grid grid-cols-[minmax(0,1fr)_290px] gap-6">
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-dark-300 to-dark-200 p-8">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80">
              Efectivo en Caja Total
            </p>
            <div className="inline-flex items-center rounded-full bg-dark-200/70 border border-black/10 dark:border-white/10 px-2 py-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-gray-400"
                onPress={onPrevMonth}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-xs font-black uppercase tracking-widest text-foreground px-2">
                {months[selectedMonth]} {selectedYear}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-gray-400"
                onPress={onNextMonth}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-primary text-4xl font-black">$</span>
            <h2 className="text-5xl leading-none font-black text-foreground tracking-tight">
              {Math.round(metrics.totalPaidMonth).toLocaleString("es-AR")}
            </h2>
          </div>

          <div className="mt-8 flex items-end gap-2 h-24">
            {barHeights.map((height, index) => (
              <div
                key={`caja-bar-${index}`}
                className={`rounded-sm w-14 ${index === barHeights.length - 2 ? "bg-primary shadow-[0_0_16px_rgba(13,181,219,0.45)]" : "bg-primary/70"}`}
                style={{ height }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-3">
              <WalletCards size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
              Cobrado Hoy
            </p>
              <p className="text-2xl font-black text-foreground mt-2">
                {formatCurrency(metrics.totalPaidDaily)}
              </p>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-300 mb-3">
              <Calendar size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
              Pendientes
            </p>
              <p className="text-2xl font-black text-foreground mt-2">
                {metrics.countPendingMonth}
              </p>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 mb-3">
              <Scale size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
              Confirmados
            </p>
              <p className="text-2xl font-black text-foreground mt-2">
                {metrics.countConfirmedMonth}
              </p>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-300 mb-3">
              <WalletCards size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
              Promedio
            </p>
              <p className="text-2xl font-black text-foreground mt-2">
                {formatCurrency(metrics.avgPrice)}
              </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-black/10 dark:border-white/10 bg-dark-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-foreground tracking-tight">
              Movimientos Recientes
            </h3>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              Visualizando los últimos movimientos de facturación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              className="uppercase font-black text-[11px] tracking-wider bg-black/10 dark:bg-white/10"
              startContent={<Filter size={14} />}
              isDisabled
            >
              Filtrar
            </Button>
            <Button
              size="sm"
              color="primary"
              className="uppercase font-black text-[11px] tracking-wider text-black"
              startContent={<Download size={14} />}
              onPress={exportCsv}
            >
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr_0.9fr_64px] px-6 py-3 bg-black/10 dark:bg-white/5 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
          <p>Socio / Jugador</p>
          <p>Concepto</p>
          <p>Fecha y Hora</p>
          <p>Monto</p>
          <p>Estado</p>
          <p className="text-right">Acción</p>
        </div>

        <div className="max-h-[460px] overflow-y-auto">
          {paginatedMovements.map((movement: any) => (
            <div
              key={movement._id}
              className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr_0.9fr_64px] items-center px-6 py-4 border-b border-black/10 dark:border-white/5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-black text-foreground text-base truncate">
                  {movement.clientName}
                </p>
                <p className="text-xs font-semibold text-gray-500">
                  {movement.clientPhone}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-300">
                {movement.court?.name ? `Alquiler ${movement.court.name}` : "Reserva"}
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {toIsoDateKey(movement.date)}
                </p>
                <p className="text-xs text-gray-500">
                  {movement.timeSlot?.startTime || "--:--"}
                </p>
              </div>
              <p className="text-lg font-black text-foreground">
                {formatCurrency(Number(movement.finalPrice) || 0)}
              </p>
              <Chip
                size="sm"
                className={`font-black uppercase ${movement.paymentStatus === "pagado" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}
              >
                {movement.paymentStatus === "pagado" ? "Pagado" : "Pendiente"}
              </Chip>
              <div className="flex justify-end">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-gray-400"
                >
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>
          ))}

          {metrics.movements.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-gray-500 font-bold">No hay movimientos para este periodo.</p>
            </div>
          )}
        </div>

        {metrics.movements.length > 0 && (
          <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              {metrics.movements.length} movimientos • página {currentPage}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                className="bg-black/10 dark:bg-white/10 font-black uppercase text-[11px]"
                isDisabled={currentPage === 1}
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="flat"
                className="bg-primary/20 text-primary border border-primary/30 font-black uppercase text-[11px]"
                isDisabled={currentPage >= totalPages}
                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
