import { useEffect, useMemo, useRef } from "react";
import { getTodayIsoLocal, toIsoDateKey } from "../../../utils/formatters";

type DateSelectorProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    return Array.from({ length: 22 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - 7 + index);
      return {
        full: toIsoDateKey(
          new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        ),
        dayName: date.toLocaleDateString("es-ES", { weekday: "short" }),
        dayNum: date.getDate(),
        monthName: date.toLocaleDateString("es-ES", { month: "long" }),
        year: date.getFullYear(),
      };
    });
  }, []);

  const selectedMonthYear = useMemo(() => {
    const day = days.find((item) => item.full === selectedDate) || days[0];
    return `${day.monthName} ${day.year}`;
  }, [selectedDate, days]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollRef.current) return;

      const selectedElement = scrollRef.current.querySelector('[data-selected="true"]');
      if (!selectedElement) return;

      selectedElement.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white uppercase tracking-tight">
          Seleccionar Fecha
        </h3>
        <span className="text-xs font-bold text-primary capitalize">
          {selectedMonthYear}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide pt-6"
      >
        {days.map((day) => {
          const isSelected = day.full === selectedDate;
          const isToday = day.full === getTodayIsoLocal();

          return (
            <button
              key={day.full}
              data-selected={isSelected}
              onClick={() => onDateChange(day.full)}
              className={`flex flex-col items-center justify-center min-w-[70px] h-[100px] rounded-[24px] border transition-all duration-300 relative ${
                isSelected
                  ? "bg-primary border-primary shadow-[0_0_20px_rgba(126,169,236,0.35)] scale-105 z-10"
                  : "bg-dark-100 border-white/5 opacity-80"
              }`}
            >
              {isToday && (
                <span
                  className={`absolute -top-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isSelected ? "bg-black text-primary" : "bg-primary text-black"}`}
                >
                  Hoy
                </span>
              )}
              <span
                className={`text-xs font-bold mb-1 ${isSelected ? "text-black/60" : "text-gray-500"}`}
              >
                {day.dayName}
              </span>
              <span
                className={`text-2xl font-black ${isSelected ? "text-black" : "text-white"}`}
              >
                {day.dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
