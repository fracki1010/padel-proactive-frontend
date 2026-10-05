interface SlotSkeletonProps {
  /** Number of court blocks to render. */
  courts?: number;
  /** Slot cards per court (kept even to fill the 2-column grid). */
  slotsPerCourt?: number;
}

const CourtHeaderSkeleton = ({ index }: { index: number }) => (
  <div className="flex items-start gap-3 mb-5 px-2">
    <span className="text-primary font-black text-base tabular-nums mt-0.5 w-7 shrink-0 opacity-40">
      {String(index).padStart(2, "0")}
    </span>
    <div className="flex-1 min-w-0">
      <div className="h-6 w-44 max-w-full rounded bg-default-200 animate-pulse" />
      <div className="flex gap-2 mt-2 flex-wrap">
        <div className="h-6 w-16 rounded-full bg-default-200 animate-pulse" />
        <div className="h-6 w-20 rounded-full bg-default-200 animate-pulse" />
      </div>
    </div>
  </div>
);

const SlotCardSkeleton = () => (
  <div className="rounded-md p-5 flex flex-col gap-3 border border-default-200 bg-default-100 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="h-6 w-16 rounded bg-default-300" />
      <div className="w-8 h-8 rounded-full bg-default-200" />
    </div>
    <div className="flex flex-col gap-1.5">
      <div className="h-2.5 w-16 rounded bg-default-200" />
      <div className="h-4 w-14 rounded bg-default-200" />
    </div>
    <div className="flex items-center justify-between mt-auto">
      <div className="h-5 w-14 rounded bg-default-200" />
      <div className="h-2.5 w-10 rounded bg-default-200" />
    </div>
  </div>
);

/**
 * Placeholder that mirrors the court + slot grid while availability loads.
 * Keeps the layout stable so the PWA feels instant instead of showing a spinner.
 */
export const SlotSkeleton = ({ courts = 2, slotsPerCourt = 4 }: SlotSkeletonProps) => {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-10">
      <span className="sr-only">Cargando turnos disponibles</span>
      {Array.from({ length: courts }, (_, courtIdx) => (
        <div key={courtIdx} aria-hidden="true">
          <CourtHeaderSkeleton index={courtIdx + 1} />
          <div className="grid grid-cols-2 gap-3 px-2">
            {Array.from({ length: slotsPerCourt }, (_, slotIdx) => (
              <SlotCardSkeleton key={slotIdx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
