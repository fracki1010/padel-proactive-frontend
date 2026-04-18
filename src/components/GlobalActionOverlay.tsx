import { Spinner } from "@heroui/react";

type GlobalActionOverlayProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  zIndexClassName?: string;
};

export const GlobalActionOverlay = ({
  isOpen,
  title,
  description = "Esto puede tardar unos segundos.",
  zIndexClassName = "z-[120]",
}: GlobalActionOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} bg-black/45 backdrop-blur-sm flex items-center justify-center`}
    >
      <div className="rounded-2xl border border-white/10 bg-dark-200/95 px-8 py-6 flex flex-col items-center gap-3 shadow-2xl">
        <Spinner color="primary" size="lg" />
        <p className="text-sm font-black uppercase tracking-[0.14em] text-foreground">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
};
