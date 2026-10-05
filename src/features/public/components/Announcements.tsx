import { AlertTriangle, Info, Tag } from "lucide-react";

import type { Announcement, AnnouncementType } from "../../../types";

type AnnouncementsProps = {
  announcements: Announcement[];
};

// Type semantics: info = club/cyan, important = attention/amber, promo = offer/green.
const TYPE_STYLES: Record<
  AnnouncementType,
  {
    container: string;
    iconWrap: string;
    title: string;
    message: string;
    Icon: typeof Info;
  }
> = {
  info: {
    container: "bg-primary/10 border-primary/30",
    iconWrap: "bg-primary/20 text-primary",
    title: "text-primary",
    message: "text-foreground/80",
    Icon: Info,
  },
  important: {
    container: "bg-amber-500/10 border-amber-500/30",
    iconWrap: "bg-amber-500/20 text-amber-400",
    title: "text-amber-300",
    message: "text-amber-100/80",
    Icon: AlertTriangle,
  },
  promo: {
    container: "bg-green-500/10 border-green-500/30",
    iconWrap: "bg-green-500/20 text-green-400",
    title: "text-green-300",
    message: "text-green-100/80",
    Icon: Tag,
  },
};

export const Announcements = ({ announcements }: AnnouncementsProps) => {
  // No active notices → render nothing at all (no placeholder, no empty box).
  if (!announcements || announcements.length === 0) return null;

  return (
    <section className="max-w-2xl mx-auto px-6 mb-6">
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {announcements.map((announcement) => {
          const style = TYPE_STYLES[announcement.type] ?? TYPE_STYLES.info;
          const { Icon } = style;
          return (
            <div
              key={announcement._id}
              role="status"
              className={`flex items-start gap-3 min-w-[260px] max-w-[420px] shrink-0 rounded-md border px-4 py-3 ${style.container}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.iconWrap}`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-black uppercase tracking-tight ${style.title}`}
                >
                  {announcement.title}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${style.message}`}>
                  {announcement.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
