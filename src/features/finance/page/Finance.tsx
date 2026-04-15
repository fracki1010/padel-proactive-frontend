import { Card, CardBody, Button, ScrollShadow } from "@heroui/react";
import {
  formatCurrency,
  formatDate,
  getTodayIsoLocal,
  toIsoDateKey,
} from "../../../utils/formatters";
import { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FinanceDesktopView } from "../components/FinanceDesktopView";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";

interface FinanceProps {
  bookings: any[];
}

export const Finance = ({ bookings }: FinanceProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const todayStr = getTodayIsoLocal();

  const metrics = useMemo(() => {
    const filteredMonth = bookings.filter((b) => {
      const d = new Date(`${toIsoDateKey(b.date)}T12:00:00Z`);
      return (
        d.getUTCMonth() === selectedMonth &&
        d.getUTCFullYear() === selectedYear
      );
    });

    const confirmedMonth = filteredMonth.filter(
      (b) => b.status === "confirmado" || b.status === "reservado",
    );
    const totalMonth = confirmedMonth.reduce(
      (acc, b) => acc + (Number(b.finalPrice) || 0),
      0,
    );

    const paidMonth = confirmedMonth.filter(
      (b) => b.paymentStatus === "pagado",
    );
    const totalPaidMonth = paidMonth.reduce(
      (acc, b) => acc + (Number(b.finalPrice) || 0),
      0,
    );

    const dailyBookings = bookings.filter((b) => {
      const d = toIsoDateKey(b.date);
      return d === todayStr;
    });
    const confirmedDaily = dailyBookings.filter(
      (b) => b.status === "confirmado" || b.status === "reservado",
    );
    const totalDaily = confirmedDaily.reduce(
      (acc, b) => acc + (Number(b.finalPrice) || 0),
      0,
    );

    const paidDaily = confirmedDaily.filter(
      (b) => b.paymentStatus === "pagado",
    );
    const totalPaidDaily = paidDaily.reduce(
      (acc, b) => acc + (Number(b.finalPrice) || 0),
      0,
    );

    return {
      totalMonth,
      totalPaidMonth,
      totalDaily,
      totalPaidDaily,
      countMonth: filteredMonth.length,
      countConfirmedMonth: confirmedMonth.length,
      countPaidMonth: paidMonth.length,
      countPendingMonth: confirmedMonth.length - paidMonth.length,
      totalPendingMonth: totalMonth - totalPaidMonth,
      countDaily: dailyBookings.length,
      countConfirmedDaily: confirmedDaily.length,
      countPaidDaily: paidDaily.length,
      avgPrice:
        confirmedMonth.length > 0 ? totalMonth / confirmedMonth.length : 0,
      movements: filteredMonth
        .slice()
        .sort(
          (a, b) => toIsoDateKey(b.date).localeCompare(toIsoDateKey(a.date)),
        ),
    };
  }, [bookings, selectedMonth, selectedYear, todayStr]);

  const {
    visibleCount: mobileVisibleCount,
    sentinelRef: mobileSentinelRef,
    hasMore: mobileHasMore,
  } = useInfiniteScroll(12, 8, metrics.movements.length);
  const visibleMobileMovements = metrics.movements.slice(0, mobileVisibleCount);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((v) => v - 1);
    } else {
      setSelectedMonth((v) => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((v) => v + 1);
    } else {
      setSelectedMonth((v) => v + 1);
    }
  };

  return (
    <div className="space-y-8 xl:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <FinanceDesktopView
        months={months}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        metrics={metrics}
      />

      <div className="lg:hidden space-y-8">
      {/* Selector de Mes */}
      <div className="flex items-center justify-between bg-dark-200 p-2 rounded-2xl border border-black/5 dark:border-white/5">
        <Button
          isIconOnly
          variant="light"
          onClick={handlePrevMonth}
          className="text-gray-400"
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">
            {months[selectedMonth]} {selectedYear}
          </h2>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
            Periodo de Facturación
          </p>
        </div>
        <Button
          isIconOnly
          variant="light"
          onClick={handleNextMonth}
          className="text-gray-400"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-4">
        <Card className="bg-primary shadow-[0_0_30px_rgba(126,169,236,0.22)] border-none overflow-hidden relative group">
          <CardBody className="p-6 sm:p-8">
            <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em] mb-1">
              Efectivo en Caja (Mes)
            </p>
            <h3 className="text-4xl sm:text-5xl font-black text-black tracking-tighter break-words">
              {formatCurrency(metrics.totalPaidMonth)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] font-black text-black/50 uppercase tracking-tight">
                {metrics.countPaidMonth} Cobros realizados
              </span>
              <div className="w-1 h-1 bg-black/20 rounded-full"></div>
              <span className="text-[12px] font-black text-black/30 uppercase tracking-tight">
                {formatCurrency(metrics.totalMonth - metrics.totalPaidMonth)}{" "}
                Pendiente de cobro
              </span>
            </div>
            <div className="flex gap-4 mt-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-black/40 uppercase">
                  Confirmados
                </span>
                <span className="text-xl font-black text-black">
                  {metrics.countConfirmedMonth}
                </span>
              </div>
              <div className="w-px h-8 bg-black/10 my-auto"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-black/40 uppercase">
                  Promedio
                </span>
                <span className="text-xl font-black text-black">
                  {formatCurrency(metrics.avgPrice)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
          <Card className="bg-dark-200 border border-black/5 dark:border-white/5 rounded-[2rem]">
            <CardBody className="p-6">
              <div className="flex flex-col gap-1">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-2">
                  <Calendar size={18} className="text-blue-500" />
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Cobrado Hoy
                </p>
                <h4 className="text-2xl font-black text-foreground">
                  {formatCurrency(metrics.totalPaidDaily)}
                </h4>
                <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">
                  TOTAL: {formatCurrency(metrics.totalDaily)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-dark-200 border border-black/5 dark:border-white/5 rounded-[2rem]">
            <CardBody className="p-6">
              <div className="flex flex-col gap-1">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-2">
                  <Clock size={18} className="text-orange-500" />
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Pendientes
                </p>
                <h4 className="text-2xl font-black text-foreground">
                  {metrics.countPendingMonth}
                </h4>
                <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">
                  {formatCurrency(metrics.totalPendingMonth)} POR COBRAR
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Últimos Movimientos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
            Movimientos del Mes
          </h3>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
            {metrics.movements.length} OPERACIONES
          </span>
        </div>

        <ScrollShadow className="max-h-[460px] xl:max-h-[560px] space-y-3">
          {metrics.movements.length > 0 ? (
            <>
              {visibleMobileMovements.map((b) => (
              <div
                key={b._id}
                className="bg-dark-200 p-4 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-black/10 dark:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      b.status === "confirmado"
                        ? "bg-primary/10 text-primary"
                        : "bg-orange-500/10 text-orange-500"
                    }`}
                  >
                    {b.status === "confirmado" ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {b.clientName}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                      {formatDate(b.date)} • {b.court?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-lg ${b.status === "confirmado" ? "text-foreground" : "text-gray-500 line-through"}`}
                  >
                    {formatCurrency(b.finalPrice)}
                  </p>
                  <p
                    className={`text-[8px] font-bold uppercase ${b.paymentStatus === "pagado" ? "text-primary" : "text-orange-500"}`}
                  >
                    {b.paymentStatus === "pagado" ? "COBRADO" : "PENDIENTE"}
                  </p>
                </div>
              </div>
              ))}
              <div ref={mobileSentinelRef} className="py-2">
                {mobileHasMore && (
                  <div className="flex justify-center py-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                      Cargando más...
                    </p>
                  </div>
                )}
                {!mobileHasMore && metrics.movements.length > 12 && (
                  <p className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest py-4">
                    {metrics.movements.length} movimientos cargados
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600 font-bold italic">
                No hay movimientos en este periodo.
              </p>
            </div>
          )}
        </ScrollShadow>
      </div>
      </div>
    </div>
  );
};
