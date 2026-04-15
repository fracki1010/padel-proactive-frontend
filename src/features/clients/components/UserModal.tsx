import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { Calendar, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useCourts, useCreateUser, useSlots, useUpdateUser } from "../../../hooks/useData";
import type { User } from "../../../types";

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  mode: "create" | "edit";
};

export const UserModal = ({ isOpen, onClose, user, mode }: UserModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fixedTurns, setFixedTurns] = useState<any[]>([]);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: courtsData } = useCourts();
  const { data: slotsData } = useSlots();

  const courts = courtsData?.data || [];
  const slots = slotsData?.data || [];

  useMemo(() => {
    if (user && mode === "edit") {
      setName(user.name);
      setPhone(user.phoneNumber);
      setFixedTurns(user.fixedTurns || []);
      return;
    }

    setName("");
    setPhone("");
    setFixedTurns([]);
  }, [user, mode, isOpen]);

  const handleAddFixedTurn = () => {
    setFixedTurns([...fixedTurns, { dayOfWeek: 1, court: "", timeSlot: "" }]);
  };

  const handleRemoveFixedTurn = (index: number) => {
    setFixedTurns(fixedTurns.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const data = {
        name,
        phoneNumber: phone,
        fixedTurns: fixedTurns.filter((fixedTurn) => fixedTurn.court && fixedTurn.timeSlot),
      };

      if (mode === "create") {
        await createUser.mutateAsync(data);
        addToast({ title: "Socio creado correctamente", color: "success" });
      } else if (user) {
        await updateUser.mutateAsync({ id: user._id, data });
        addToast({ title: "Socio guardado correctamente", color: "success" });
      }

      onClose();
    } catch (_error) {
      addToast({ title: "Error al guardar socio", color: "danger" });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      className="bg-dark-300 text-foreground dark"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-xl font-black">
            {mode === "create" ? "Nuevo Socio" : "Editar Socio"}
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            Completa la información del perfil del socio.
          </p>
        </ModalHeader>
        <ModalBody className="py-6 space-y-6 dark">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              placeholder="Ej: Juan Perez"
              value={name}
              onValueChange={setName}
              variant="bordered"
              className="dark"
            />
            <Input
              label="Teléfono"
              placeholder="Ej: 549..."
              value={phone}
              onValueChange={setPhone}
              variant="bordered"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                Turnos Fijos
              </h3>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="rounded-xl font-bold"
                onClick={handleAddFixedTurn}
              >
                Agregar
              </Button>
            </div>

            {fixedTurns.length === 0 ? (
              <p className="text-sm text-gray-500 bg-dark-200 p-4 rounded-2xl border border-dashed border-black/5 dark:border-white/5 text-center">
                No tiene turnos fijos asignados.
              </p>
            ) : (
              <div className="space-y-3">
                {fixedTurns.map((fixedTurn, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-dark-200 p-3 rounded-2xl border border-black/5 dark:border-white/5 relative group"
                  >
                    <div className="sm:col-span-4">
                      <Select
                        label="Día"
                        size="sm"
                        variant="flat"
                        className="dark"
                        classNames={{
                          trigger:
                            "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                          label: "text-gray-400 font-bold mb-2",
                          value: "text-foreground font-bold",
                          popoverContent:
                            "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                          listbox: "text-foreground",
                        }}
                        selectedKeys={[fixedTurn.dayOfWeek.toString()]}
                        onSelectionChange={(keys) => {
                          const newTurns = [...fixedTurns];
                          newTurns[index].dayOfWeek = parseInt(
                            Array.from(keys)[0] as string,
                          );
                          setFixedTurns(newTurns);
                        }}
                      >
                        <SelectItem key="1">Lunes</SelectItem>
                        <SelectItem key="2">Martes</SelectItem>
                        <SelectItem key="3">Miércoles</SelectItem>
                        <SelectItem key="4">Jueves</SelectItem>
                        <SelectItem key="5">Viernes</SelectItem>
                        <SelectItem key="6">Sábado</SelectItem>
                        <SelectItem key="0">Domingo</SelectItem>
                      </Select>
                    </div>
                    <div className="sm:col-span-4">
                      <Select
                        label="Cancha"
                        size="sm"
                        variant="flat"
                        className="dark"
                        classNames={{
                          trigger:
                            "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                          label: "text-gray-400 font-bold mb-2",
                          value: "text-foreground font-bold",
                          popoverContent:
                            "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                          listbox: "text-foreground",
                        }}
                        selectedKeys={[fixedTurn.court?._id || fixedTurn.court || ""]}
                        onSelectionChange={(keys) => {
                          const newTurns = [...fixedTurns];
                          newTurns[index].court = Array.from(keys)[0] as string;
                          setFixedTurns(newTurns);
                        }}
                      >
                        {courts.map((court: any) => (
                          <SelectItem key={court._id}>{court.name}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-3">
                      <Select
                        label="Hora"
                        size="sm"
                        variant="flat"
                        className="dark"
                        classNames={{
                          trigger:
                            "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                          label: "text-gray-400 font-bold mb-2",
                          value: "text-foreground font-bold",
                          popoverContent:
                            "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                          listbox: "text-foreground",
                        }}
                        selectedKeys={[fixedTurn.timeSlot?._id || fixedTurn.timeSlot || ""]}
                        onSelectionChange={(keys) => {
                          const newTurns = [...fixedTurns];
                          newTurns[index].timeSlot = Array.from(keys)[0] as string;
                          setFixedTurns(newTurns);
                        }}
                      >
                        {slots.map((slot: any) => (
                          <SelectItem key={slot._id}>{slot.startTime}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-1 pb-1 text-right sm:text-center">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onClick={() => handleRemoveFixedTurn(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-black/5 dark:border-white/5 pt-4">
          <Button
            variant="light"
            onPress={onClose}
            className="rounded-2xl font-bold"
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            className="rounded-2xl font-black px-8"
            isLoading={createUser.isPending || updateUser.isPending}
          >
            {mode === "create" ? "Crear" : "Guardar Cambios"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
