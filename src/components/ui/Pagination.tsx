import { Button, Input } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  itemsLabel: string;
  className?: string;
};

/**
 * Build the visible page numbers with ellipsis gaps.
 * Always shows first, last, current, and up to 2 neighbours.
 * Returns an array of numbers and `null` for ellipsis slots.
 */
function getPageRange(current: number, total: number): (number | null)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push(null); // left ellipsis

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total - 1) pages.push(null); // right ellipsis

  pages.push(total);
  return pages;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize: _pageSize,
  itemsLabel,
  className = "",
}: PaginationProps) => {
  const [jumpValue, setJumpValue] = useState("");

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pages = useMemo(() => getPageRange(safePage, totalPages), [safePage, totalPages]);

  const handleJump = useCallback(() => {
    const target = parseInt(jumpValue, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpValue("");
    }
  }, [jumpValue, totalPages, onPageChange]);

  if (totalPages <= 0 || totalItems === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-black/10 dark:border-white/10 ${className}`}
    >
      {/* Info label */}
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
        {totalItems} {itemsLabel} &bull; p&aacute;gina {safePage}/{totalPages}
      </p>

      {/* Page numbers — hidden on small screens */}
      {totalPages > 1 && (
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, idx) =>
            page === null ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-on-surface-variant font-semibold text-sm select-none"
              >
                &hellip;
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-semibold transition-colors
                  ${
                    page === safePage
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
      )}

      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="flat"
          className="bg-black/10 dark:bg-white/10 font-black uppercase text-[11px] rounded-md"
          isDisabled={safePage === 1}
          onPress={() => onPageChange(Math.max(1, safePage - 1))}
          startContent={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Anterior</span>
          <span className="sm:hidden">Ant.</span>
        </Button>

        {/* Jump-to-page input — only when totalPages > 5 */}
        {totalPages > 5 && (
          <Input
            type="number"
            size="sm"
            variant="bordered"
            placeholder="#"
            value={jumpValue}
            onValueChange={setJumpValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJump();
            }}
            className="w-14"
            classNames={{
              input: "text-center text-[11px] font-semibold px-1",
              inputWrapper: "h-8 min-h-8",
            }}
            min={1}
            max={totalPages}
            aria-label="Ir a página"
          />
        )}

        <Button
          size="sm"
          variant="flat"
          className="bg-primary/20 text-primary border border-primary/30 font-black uppercase text-[11px] rounded-md"
          isDisabled={safePage >= totalPages}
          onPress={() => onPageChange(Math.min(totalPages, safePage + 1))}
          endContent={<ChevronRight className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <span className="sm:hidden">Sig.</span>
        </Button>
      </div>
    </div>
  );
};
