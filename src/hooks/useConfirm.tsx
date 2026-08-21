import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ConfirmModal, type ConfirmModalVariant } from "../components/ConfirmModal";

type ConfirmOptions = {
  title?: string;
  variant?: ConfirmModalVariant;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

type ConfirmState = {
  isOpen: boolean;
  message: string;
  title?: string;
  variant: ConfirmModalVariant;
  confirmText?: string;
  cancelText?: string;
  resolve: ((value: boolean) => void) | null;
};

const initialConfirmState: ConfirmState = {
  isOpen: false,
  message: "",
  variant: "default",
  resolve: null,
};

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ConfirmState>(initialConfirmState);

  const confirm: ConfirmFn = useCallback((message, options) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        message,
        title: options?.title,
        variant: options?.variant ?? "default",
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    state.resolve?.(false);
    setState(initialConfirmState);
  }, [state.resolve]);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(initialConfirmState);
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={state.title}
        message={state.message}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};
