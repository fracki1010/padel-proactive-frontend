import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { X } from "lucide-react";

import { Profile } from "../../profile/page/Profile";

type ProfileDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  courts: any[];
};

export const ProfileDrawer = ({
  isOpen,
  onOpenChange,
  courts,
}: ProfileDrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      size="full"
      hideCloseButton
      onOpenChange={onOpenChange}
      placement="bottom"
      backdrop="blur"
      classNames={{
        base: "rounded-t-[3rem] bg-dark-200 border-t border-white/10",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-row items-center justify-between p-4 sm:p-8 text-center pb-0 pt-safe">
              <div className="w-10 h-10" />
              <Button
                isIconOnly
                variant="flat"
                className="bg-white/5 text-white rounded-2xl"
                onPress={onClose}
              >
                <X size={20} />
              </Button>
            </DrawerHeader>
            <DrawerBody id="profile-drawer-body" className="p-4 sm:p-8 pt-0 overflow-y-auto">
              <Profile courts={courts} />
              <Button
                variant="flat"
                className="h-16 text-white bg-white/5 rounded-3xl font-bold mb-6"
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
