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
      className="bg-background/95 backdrop-blur border-b border-black/10 dark:border-white/10 h-auto min-h-[70px] pt-safe pb-2"
      classNames={{
        wrapper:
          "w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 gap-0 h-auto min-h-[70px] items-center",
      }}
    >
      <NavbarContent justify="start" className="gap-4">
        <p className="text-base sm:text-lg lg:text-xl font-black text-foreground tracking-tight truncate max-w-[56vw] sm:max-w-none uppercase">
          {title}
        </p>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2 sm:gap-4">
        <Button
          isIconOnly
          variant="light"
          className="hidden lg:flex bg-dark-100/50 text-gray-400 border border-black/10 dark:border-white/10 w-11 h-11"
          radius="lg"
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
            className="bg-dark-100/50 text-primary border border-primary/20 w-11 h-11"
            radius="lg"
            onPress={onBellClick}
          >
            <Bell size={20} />
          </Button>
        </Badge>
        <Avatar
          src={avatarSrc}
          name={initials}
          className="w-10 h-10 border-2 border-primary/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          radius="lg"
          style={!avatarSrc ? { backgroundColor: getAvatarColor(avatarName) } : undefined}
          onClick={onAvatarClick}
        />
      </NavbarContent>
    </HeroNavbar>
  );
};
