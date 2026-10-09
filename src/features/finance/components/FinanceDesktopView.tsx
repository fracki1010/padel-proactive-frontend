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

import { formatCurrency, formatPhoneForDisplay, toIsoDateKey } from "../../../utils/formatters";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Pagination } from "../../../components/ui/Pagination";
import { StatCard } from "../../../components/ui/StatCard";

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

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const BAR_MAX_PX = 96;

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

  const { dailyRevenue, dayLabels, maxRevenue } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - (6 - i));
      return d;
    });

    const labels = days.map((d) => DAY_LABELS[d.getUTCDay()]);
    const dateKeys = days.map((d) => toIsoDateKey(d));

    const revenue = dateKeys.map((key) => {
      const dayMovements = metrics.movements.filter(
        (m) => toIsoDateKey(m.date) === key && m.paymentStatus === "pagado",
      );
      return dayMovements.reduce((sum, m) => sum + (Number(m.finalPrice) || 0), 0);
    });

    return { dailyRevenue: revenue, dayLabels: labels, maxRevenue: Math.max(...revenue, 1) };
  }, [metrics.movements]);

  const normalizedHeights = dailyRevenue.map((v) => (v / maxRevenue) * BAR_MAX_PX);
  const hasRevenue = dailyRevenue.some((v) => v > 0);

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
        <div className="rounded-md border border-black/10 dark:border-white/10 bg-gradient-to-br from-dark-300 to-dark-200 p-8">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80">
              Efectivo en Caja Total
            </p>
            <div className="inline-flex items-center rounded-full bg-dark-200/70 border border-black/10 dark:border-white/10 px-2 py-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-on-surface-variant"
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
                className="text-on-surface-variant"
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

          {hasRevenue ? (
            <div className="mt-8 flex items-end gap-2 h-28">
              {dailyRevenue.map((value, index) => (
                <div key={`caja-bar-${index}`} className="flex flex-col items-center flex-1 min-w-0">
                  {value > 0 && (
                    <span className="text-[9px] font-bold text-primary mb-1">
                      ${Math.round(value).toLocaleString("es-AR")}
                    </span>
                  )}
                  <div
                    className="w-full max-w-14 rounded-t-md bg-primary hover:opacity-80 transition-opacity cursor-default"
                    style={{ height: normalizedHeights[index] || 2 }}
                  />
                  <span className="text-[10px] font-semibold text-on-surface-variant mt-1">
                    {dayLabels[index]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-center h-28">
              <p className="text-on-surface-variant font-semibold text-sm">Sin ingresos en los últimos 7 días</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<WalletCards size={15} />} label="Cobrado Hoy" value={formatCurrency(metrics.totalPaidDaily)} iconColor="primary" />
          <StatCard icon={<Calendar size={15} />} label="Pendientes" value={metrics.countPendingMonth} iconColor="amber" />
          <StatCard icon={<Scale size={15} />} label="Confirmados" value={metrics.countConfirmedMonth} iconColor="emerald" />
          <StatCard icon={<WalletCards size={15} />} label="Promedio" value={formatCurrency(metrics.avgPrice)} iconColor="violet" />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-black/10 dark:border-white/10 bg-dark-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-black/10 dark:border-white/10">
          <SectionHeader
            title="Movimientos Recientes"
            subtitle="Visualizando los últimos movimientos de facturación"
            headingLevel="h3"
            actions={
              <>
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
                  className="uppercase font-black text-[11px] tracking-wider text-on-primary"
                  startContent={<Download size={14} />}
                  onPress={exportCsv}
                >
                  Exportar
                </Button>
              </>
            }
          />
        </div>

        <div className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr_0.9fr_64px] px-6 py-3 bg-black/10 dark:bg-white/5 text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
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
                <p className="text-xs font-semibold text-on-surface-variant">
                  {formatPhoneForDisplay(movement.clientPhone)}
                </p>
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">
                {movement.court?.name ? `Alquiler ${movement.court.name}` : "Reserva"}
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {toIsoDateKey(movement.date)}
                </p>
                <p className="text-xs text-on-surface-variant">
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
                  className="text-on-surface-variant"
                >
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>
          ))}

          {metrics.movements.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-on-surface-variant font-bold">No hay movimientos para este periodo.</p>
            </div>
          )}
        </div>

        {metrics.movements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={metrics.movements.length}
            pageSize={PAGE_SIZE}
            itemsLabel="movimientos"
          />
        )}
      </div>
    </div>
  );
};
