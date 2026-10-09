import {
  Navbar as HeroNavbar,
  NavbarContent,
  Button,
  Avatar,
  Badge,
} from "@heroui/react";
import { Bell, HelpCircle } from "lucide-react";
import { getAvatarColor, getInitials } from "../utils/avatarUtils";

interface NavbarProps {
  title?: string;
  onAvatarClick?: () => void;
  onBellClick?: () => void;
  notificationCount?: number;
  avatarName?: string;
  avatarSrc?: string;
}

export const Navbar = ({
  title = "Turnos de Hoy",
  onAvatarClick,
  onBellClick,
  notificationCount = 0,
  avatarName = "Admin PADEXA",
  avatarSrc,
}: NavbarProps) => {
  const initials = getInitials(avatarName);

  return (
    <HeroNavbar
      maxWidth="full"
      className="bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)] h-auto min-h-16 pt-safe pb-2"
      classNames={{
        wrapper:
          "w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 gap-0 h-auto min-h-16 items-center",
      }}
    >
      <NavbarContent justify="start" className="gap-4">
        <p className="md3-typescale-title-large text-[var(--md-sys-color-on-surface)] truncate max-w-[56vw] sm:max-w-none">
          {title}
        </p>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2 sm:gap-4">
        <Button
          isIconOnly
          variant="light"
          aria-label="Ayuda"
          className="hidden lg:flex bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] w-11 h-11"
          radius="full"
          isDisabled
        >
          <HelpCircle size={18} />
        </Button>
        <Badge
          color="danger"
          content={notificationCount}
          isInvisible={notificationCount === 0}
          shape="circle"
          size="md"
          placement="top-right"
        >
          <Button
            isIconOnly
            variant="flat"
            aria-label="Notificaciones"
            className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] w-11 h-11"
            radius="full"
            onPress={onBellClick}
          >
            <Bell size={20} />
          </Button>
        </Badge>
        <Avatar
          src={avatarSrc}
          name={initials}
          role="button"
          tabIndex={0}
          aria-label="Mi cuenta"
          className="w-11 h-11 border-2 border-[var(--md-sys-color-outline-variant)] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          radius="full"
          style={!avatarSrc ? { backgroundColor: getAvatarColor(avatarName) } : undefined}
          onClick={onAvatarClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onAvatarClick?.();
            }
          }}
        />
      </NavbarContent>
    </HeroNavbar>
  );
};
