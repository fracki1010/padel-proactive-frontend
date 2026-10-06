interface SlotSkeletonProps {
  /** Number of time rows to render. */
  rows?: number;
}

const SlotRowSkeleton = () => (
  <div className="flex items-center gap-4 px-4 py-4 border-b border-default-100 last:border-b-0 animate-pulse">
    <div className="w-20 shrink-0">
      <div className="h-6 w-14 rounded bg-default-300" />
      <div className="h-2.5 w-10 rounded bg-default-200 mt-2" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="h-4 w-28 rounded bg-default-200" />
    </div>
    <div className="w-9 h-9 rounded-full bg-default-200 shrink-0" />
  </div>
);

/**
 * Placeholder that mirrors the time-first availability list while it loads.
 * Keeps the layout stable so the PWA feels instant instead of showing a spinner.
 */
export const SlotSkeleton = ({ rows = 6 }: SlotSkeletonProps) => {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Cargando turnos disponibles</span>
      <div className="flex items-center justify-between px-2" aria-hidden="true">
        <div className="h-3 w-20 rounded bg-default-200 animate-pulse" />
        <div className="h-3 w-24 rounded bg-default-200 animate-pulse" />
      </div>
      <div
        aria-hidden="true"
        className="flex flex-col rounded-2xl border border-default-200 bg-default-50/60 overflow-hidden"
      >
        {Array.from({ length: rows }, (_, index) => (
          <SlotRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
