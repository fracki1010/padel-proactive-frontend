interface SlotSkeletonProps {
  /** Number of time rows to render. */
  rows?: number;
}

const SlotRowSkeleton = () => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3.5 animate-pulse">
    <div>
      <div className="h-6 w-16 rounded bg-surface-container-high" />
      <div className="h-2.5 w-24 rounded bg-surface-container-high mt-2" />
    </div>
    <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
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
      <div className="flex items-center justify-between px-1" aria-hidden="true">
        <div className="h-3 w-20 rounded bg-surface-container-high animate-pulse" />
        <div className="h-3 w-24 rounded bg-surface-container-high animate-pulse" />
      </div>
      <div
        aria-hidden="true"
        className="flex flex-col gap-3"
      >
        {Array.from({ length: rows }, (_, index) => (
          <SlotRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
