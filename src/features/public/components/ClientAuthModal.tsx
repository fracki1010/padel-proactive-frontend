import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  Tabs,
  addToast,
} from "@heroui/react";
import { useState } from "react";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { publicService } from "../../../services/publicService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onSuccess?: () => void;
}

export const ClientAuthModal = ({ isOpen, onClose, slug, onSuccess }: Props) => {
  const { loginClient } = useClientAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      addToast({ title: "Completá todos los campos", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.login(slug, {
        email: loginForm.email,
        password: loginForm.password,
      });
      loginClient(res.data.token, res.data.client);
      addToast({ title: `Bienvenido/a, ${res.data.client.name}`, color: "success" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "Error al iniciar sesión",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword } = registerForm;
    if (!name || !email || !phone || !password) {
      addToast({ title: "Completá todos los campos", color: "warning" });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ title: "Las contraseñas no coinciden", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.register(slug, { name, email, phone, password });
      loginClient(res.data.token, res.data.client);
      addToast({ title: `Cuenta creada. Bienvenido/a, ${res.data.client.name}!`, color: "success" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "Error al registrarse",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" size="sm">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-lg font-bold">Mi cuenta</span>
          <span className="text-sm text-default-500 font-normal">
            Ingresá o creá una cuenta para reservar
          </span>
        </ModalHeader>
        <ModalBody className="pb-6">
          <Tabs
            selectedKey={tab}
            onSelectionChange={(key) => setTab(key as "login" | "register")}
            fullWidth
            size="sm"
          >
            <Tab key="login" title="Ingresar">
              <div className="flex flex-col gap-3 mt-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginForm.email}
                  onValueChange={(v) => setLoginForm((p) => ({ ...p, email: v }))}
                  size="sm"
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Tu contraseña"
                  value={loginForm.password}
                  onValueChange={(v) => setLoginForm((p) => ({ ...p, password: v }))}
                  size="sm"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <Button
                  color="primary"
                  onPress={handleLogin}
                  isLoading={isLoading}
                  fullWidth
                  className="mt-1"
                >
                  Ingresar
                </Button>
              </div>
            </Tab>
            <Tab key="register" title="Registrarme">
              <div className="flex flex-col gap-3 mt-2">
                <Input
                  label="Nombre completo"
                  placeholder="Juan García"
                  value={registerForm.name}
                  onValueChange={(v) => setRegisterForm((p) => ({ ...p, name: v }))}
                  size="sm"
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={registerForm.email}
                  onValueChange={(v) => setRegisterForm((p) => ({ ...p, email: v }))}
                  size="sm"
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={registerForm.phone}
                  onValueChange={(v) => setRegisterForm((p) => ({ ...p, phone: v }))}
                  size="sm"
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={registerForm.password}
                  onValueChange={(v) => setRegisterForm((p) => ({ ...p, password: v }))}
                  size="sm"
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repetí tu contraseña"
                  value={registerForm.confirmPassword}
                  onValueChange={(v) => setRegisterForm((p) => ({ ...p, confirmPassword: v }))}
                  size="sm"
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                <Button
                  color="primary"
                  onPress={handleRegister}
                  isLoading={isLoading}
                  fullWidth
                  className="mt-1"
                >
                  Crear cuenta
                </Button>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
