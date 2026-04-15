import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { X } from "lucide-react";

import { Profile } from "../../profile/page/Profile";

type ProfileDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  courts: any[];
  isDesktop?: boolean;
};

export const ProfileDrawer = ({
  isOpen,
  onOpenChange,
  courts,
  isDesktop = false,
}: ProfileDrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      size={isDesktop ? "4xl" : "full"}
      hideCloseButton
      onOpenChange={onOpenChange}
      placement={isDesktop ? "right" : "bottom"}
      backdrop="blur"
      classNames={{
        base: isDesktop
          ? "bg-dark-200 border-l border-black/10 dark:border-white/10"
          : "rounded-t-[3rem] bg-dark-200 border-t border-black/10 dark:border-white/10",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader
              className={`flex flex-row items-center justify-between p-4 sm:p-8 text-center pb-0 ${isDesktop ? "pt-4 sm:pt-6" : "pt-safe"}`}
            >
              <div className="w-10 h-10" />
              <Button
                isIconOnly
                variant="flat"
                className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl"
                onPress={onClose}
              >
                <X size={20} />
              </Button>
            </DrawerHeader>
            <DrawerBody id="profile-drawer-body" className="p-4 sm:p-8 pt-0 overflow-y-auto">
              <Profile courts={courts} />
              <Button
                variant="flat"
                className="h-16 text-foreground bg-black/5 dark:bg-white/5 rounded-3xl font-bold mb-6"
                onPress={onClose}
              >
                Volver al Panel
              </Button>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
