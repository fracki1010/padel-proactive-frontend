export function SkeletonCard() {
  return (
    <div className="rounded-md border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-dark-300 mb-2" />
      <div className="h-3 w-16 bg-dark-300 rounded mb-2" />
      <div className="h-7 w-12 bg-dark-300 rounded" />
    </div>
  );
}
