import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ConfirmModalVariant = "default" | "danger";

export type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isConfirmLoading?: boolean;
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isConfirmLoading = false,
}: ConfirmModalProps) => {
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          placement="center"
          backdrop="blur"
          size="sm"
          className="bg-dark-300 text-foreground dark rounded-md"
          isDismissable={!isConfirmLoading}
          isKeyboardDismissDisabled={isConfirmLoading}
        >
          <ModalContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <ModalHeader className="flex items-center gap-2 pb-3">
                {isDanger && (
                  <AlertTriangle size={20} className="text-red-400 shrink-0" />
                )}
                <h2 className="text-lg font-black text-foreground">
                  {title || (isDanger ? "Acción peligrosa" : "Confirmar")}
                </h2>
              </ModalHeader>
              <ModalBody className="pb-2">
                <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
              </ModalBody>
              <ModalFooter className="pt-3 border-t border-black/5 dark:border-white/5">
                <Button
                  variant="light"
                  onPress={onClose}
                  className="rounded-md font-bold"
                  isDisabled={isConfirmLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  color={isDanger ? "danger" : "primary"}
                  onPress={onConfirm}
                  className={`rounded-md font-black px-6 ${isDanger ? "shadow-lg shadow-danger/20" : "shadow-lg shadow-primary/20"}`}
                  isLoading={isConfirmLoading}
                >
                  {confirmText}
                </Button>
              </ModalFooter>
            </motion.div>
          </ModalContent>
        </Modal>
      )}
    </AnimatePresence>
  );
};
