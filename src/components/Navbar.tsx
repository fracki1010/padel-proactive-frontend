import {
  Navbar as HeroNavbar,
  NavbarContent,
  Button,
  Avatar,
  Badge,
} from "@heroui/react";
import { Bell } from "lucide-react";
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
  avatarName = "Admin Padel",
  avatarSrc,
}: NavbarProps) => {
  const initials = getInitials(avatarName);

  return (
    <HeroNavbar
      maxWidth="full"
      className="bg-background/95 backdrop-blur border-none h-auto min-h-[76px] pt-safe pb-2"
      classNames={{
        wrapper: "px-4 sm:px-6 gap-0 h-auto min-h-[76px] items-center",
      }}
    >
      <NavbarContent justify="start" className="gap-4">
        <p className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-[56vw] sm:max-w-none">
          {title}
        </p>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2 sm:gap-4">
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
