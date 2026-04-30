import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { DigestBackground } from "../../../services/configService";
import { api } from "../../../services/httpClient";

const clog = (level: "log" | "error", msg: string, data?: unknown) => {
  api.post("/config/client-log", { level, message: msg, data }).catch(() => {});
};

const MAX_SLOTS = 6;
const MAX_MB = 10;

type Props = {
  backgrounds: DigestBackground[];
  isUploading: boolean;
  isDeleting: boolean;
  onUpload: (file: File, order: number) => void;
  onDelete: (id: string) => void;
};

export const DigestBackgroundsGrid = ({
  backgrounds,
  isUploading,
  isDeleting,
  onUpload,
  onDelete,
}: Props) => {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingOrder, setUploadingOrder] = useState<number | null>(null);

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
    const order = i + 1;
    const bg = backgrounds.find((b) => b.order === order);
    return { order, bg };
  });

  const handleFileChange = (order: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    clog("log", "handleFileChange triggered", { hasFile: !!file, order });
    if (!file) return;
    clog("log", "file selected", { name: file.name, type: file.type, size: file.size, order });
    e.target.value = "";
    if (file.size > MAX_MB * 1024 * 1024) {
      clog("error", "file too large", { size: file.size, max: MAX_MB * 1024 * 1024 });
      alert(`La imagen debe pesar menos de ${MAX_MB}MB.`);
      return;
    }
    clog("log", "calling onUpload", { order });
    setUploadingOrder(order);
    onUpload(file, order);
  };

  // Clear uploading indicator once the mutation finishes
  if (!isUploading && uploadingOrder !== null) {
    setUploadingOrder(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
        Fondos de imagen ({backgrounds.length}/{MAX_SLOTS}) — se elige uno al azar por envío
      </p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map(({ order, bg }) => {
          const isThisUploading = uploadingOrder === order && isUploading;
          return (
            <div
              key={order}
              className="relative aspect-video rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
            >
              {bg ? (
                <>
                  <img
                    src={bg.url}
                    alt={`Fondo ${order}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onDelete(bg._id)}
                    disabled={isDeleting || isUploading}
                    className="absolute top-1 right-1 p-1 rounded-xl bg-black/60 text-white hover:bg-red-500 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => inputRefs.current[order]?.click()}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 p-1 rounded-xl bg-black/60 text-white hover:bg-sky-400 transition-colors disabled:opacity-40"
                  >
                    <ImagePlus size={13} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current[order]?.click()}
                  disabled={isUploading}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-sky-400 transition-colors disabled:opacity-40"
                >
                  <ImagePlus size={20} />
                  <span className="text-[10px] font-black uppercase">{order}</span>
                </button>
              )}

              {/* Loading overlay for the active slot */}
              {isThisUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 backdrop-blur-sm">
                  <Loader2 size={22} className="text-white animate-spin" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">
                    Subiendo…
                  </span>
                </div>
              )}

              <input
                ref={(el) => { inputRefs.current[order] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(order, e)}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400">
        JPG, PNG, WebP o HEIC · máx {MAX_MB}MB · si no hay fondos se usa el fondo oscuro predeterminado.
      </p>
    </div>
  );
};
