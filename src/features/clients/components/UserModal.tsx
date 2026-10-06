import {
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Input,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";

import { useCreateUser, useUpdateUser } from "../../../hooks/useData";
import { useKeyboardScroll } from "../../../hooks/useKeyboardScroll";
import {
  fieldInputClassNames,
  fieldSelectClassNames,
} from "../../../components/ui/fieldStyles";
import type { User } from "../../../types";
import {
  composePhoneForStorage,
  DEFAULT_PHONE_COUNTRY_ID,
  parseStoredPhone,
  PHONE_COUNTRY_OPTIONS,
  type PhoneCountryId,
} from "../../../utils/phone";

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  mode: "create" | "edit";
};

export const UserModal = ({ isOpen, onClose, user, mode }: UserModalProps) => {
  const initialPhone = mode === "edit" && user ? parseStoredPhone(user.phoneNumber) : null;
  const [name, setName] = useState(mode === "edit" && user ? user.name : "");
  const [phoneLocal, setPhoneLocal] = useState(initialPhone?.localNumber || "");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountryId>(
    initialPhone?.countryId || DEFAULT_PHONE_COUNTRY_ID,
  );

  const nameInputRef = useKeyboardScroll<HTMLInputElement>();
  const phoneInputRef = useKeyboardScroll<HTMLInputElement>();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const isPhoneLocked = mode === "edit" && Boolean(user?.isVerified);

  const handleSave = async () => {
    try {
      const data: { name: string; phoneNumber?: string } = { name };

      // Verified clients have a phone verified via WhatsApp OTP; never resend
      // it so the backend phone-lock guard is not triggered.
      if (!isPhoneLocked) {
        data.phoneNumber = composePhoneForStorage(phoneCountry, phoneLocal);
      }

      if (mode === "create") {
        await createUser.mutateAsync(data);
        addToast({ title: "Socio creado correctamente", color: "success" });
      } else if (user) {
        await updateUser.mutateAsync({ id: user._id, data });
        addToast({ title: "Socio guardado correctamente", color: "success" });
      }

      onClose();
    } catch {
      addToast({ title: "Error al guardar socio", color: "danger" });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      placement="right"
      backdrop="blur"
    >
      <DrawerContent className="bg-dark-300 text-foreground dark">
        <DrawerHeader className="flex flex-col gap-1 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-2xl font-black">
            {mode === "create" ? "Nuevo Socio" : "Editar Socio"}
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            Completa la información del perfil del socio.
          </p>
        </DrawerHeader>
        <DrawerBody className="py-8 space-y-8 dark">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Nombre Completo
              </label>
              <Input
                ref={nameInputRef}
                placeholder="Ej: Juan Perez"
                value={name}
                onValueChange={setName}
                variant="bordered"
                size="lg"
                classNames={fieldInputClassNames.lg}
                className="dark"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Teléfono
              </label>
              <div className="flex gap-3">
                <Select
                  label="País"
                  selectedKeys={[phoneCountry]}
                  onSelectionChange={(keys) => {
                    const nextCountry = Array.from(keys)[0] as PhoneCountryId;
                    if (nextCountry) setPhoneCountry(nextCountry);
                  }}
                  variant="bordered"
                  size="lg"
                  className="w-48"
                  classNames={fieldSelectClassNames.lg}
                  isDisabled={isPhoneLocked}
                >
                  {PHONE_COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country.id} textValue={`${country.label} (${country.dialCode})`}>
                      {country.label} ({country.dialCode})
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  ref={phoneInputRef}
                  placeholder="Ej: 351..."
                  value={phoneLocal}
                  onValueChange={(value) => setPhoneLocal(value.replace(/\D/g, ""))}
                  variant="bordered"
                  size="lg"
                  className="flex-grow"
                  classNames={fieldInputClassNames.lg}
                  isDisabled={isPhoneLocked}
                />
              </div>
              {isPhoneLocked && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                  <BadgeCheck size={14} />
                  Teléfono verificado por WhatsApp — no editable
                </p>
              )}
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter className="border-t border-black/5 dark:border-white/5 pt-4">
          <div className="flex gap-3 w-full max-w-2xl mx-auto">
            <Button
              variant="light"
              onPress={onClose}
              className="rounded-md font-bold flex-1"
              size="lg"
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              className="rounded-md font-black flex-1"
              size="lg"
              isLoading={createUser.isPending || updateUser.isPending}
            >
              {mode === "create" ? "Crear Socio" : "Guardar Cambios"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
