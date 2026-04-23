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
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { firebaseAuth, googleProvider } from "../../../lib/firebase";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { publicService } from "../../../services/publicService";
import { PhoneInput, defaultPhone } from "./PhoneInput";
import type { PhoneValue } from "./PhoneInput";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onSuccess?: () => void;
}

// Pasos del modal
type Step =
  | "main"            // login / registro
  | "reg_phone"       // registro: pedir teléfono + enviar OTP
  | "reg_otp"         // registro: ingresar OTP
  | "google_phone"    // google nuevo: pedir teléfono + enviar OTP
  | "google_otp";     // google nuevo: ingresar OTP

export const ClientAuthModal = ({ isOpen, onClose, slug, onSuccess }: Props) => {
  const { loginClient } = useClientAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [step, setStep] = useState<Step>("main");
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario de login
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Estado del formulario de registro
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [regPhone, setRegPhone] = useState<PhoneValue>(defaultPhone());
  const [regMasked, setRegMasked] = useState("");
  const [regOtp, setRegOtp] = useState("");

  // Estado para flujo Google
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [googlePhone, setGooglePhone] = useState<PhoneValue>(defaultPhone());
  const [googleMasked, setGoogleMasked] = useState("");
  const [googleOtp, setGoogleOtp] = useState("");
  const [_googlePendingToken, setGooglePendingToken] = useState("");

  const reset = () => {
    setStep("main");
    setTab("login");
    setLoginForm({ email: "", password: "" });
    setRegForm({ name: "", email: "", password: "", confirmPassword: "" });
    setRegPhone(defaultPhone());
    setRegOtp("");
    setGoogleIdToken("");
    setGooglePhone(defaultPhone());
    setGoogleOtp("");
    setGooglePendingToken("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const completeLogin = (token: string, client: any) => {
    loginClient(token, client);
    addToast({ title: `Bienvenido/a, ${client.name}`, color: "success" });
    reset();
    onClose();
    onSuccess?.();
  };

  // ─── Login con email ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      addToast({ title: "Completá todos los campos", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.login(slug, loginForm);
      completeLogin(res.data.token, res.data.client);
    } catch (err: any) {
      addToast({ title: err?.response?.data?.error || "Email o contraseña incorrectos", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Registro paso 1: validar datos y pedir teléfono ───────────────────────
  const handleRegNextToPhone = () => {
    const { name, email, password, confirmPassword } = regForm;
    if (!name || !email || !password) {
      addToast({ title: "Nombre, email y contraseña son requeridos", color: "warning" });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ title: "Las contraseñas no coinciden", color: "warning" });
      return;
    }
    if (password.length < 6) {
      addToast({ title: "La contraseña debe tener al menos 6 caracteres", color: "warning" });
      return;
    }
    setStep("reg_phone");
  };

  // ─── Registro paso 2: enviar OTP al teléfono ───────────────────────────────
  const handleRegSendOtp = async () => {
    if (!regPhone.localNumber.trim()) {
      addToast({ title: "Ingresá tu número de teléfono", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.sendOtp(slug, regPhone.countryCode, regPhone.localNumber);
      setRegMasked(res.data.masked);
      setStep("reg_otp");
      addToast({ title: `Código enviado a WhatsApp ***${res.data.masked}`, color: "success" });
    } catch (err: any) {
      addToast({ title: err?.response?.data?.error || "No se pudo enviar el código", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Registro paso 3: verificar OTP y crear cuenta ─────────────────────────
  const handleRegVerifyOtp = async () => {
    if (!regOtp.trim()) {
      addToast({ title: "Ingresá el código de verificación", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.register(slug, {
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        countryCode: regPhone.countryCode,
        localNumber: regPhone.localNumber,
        otp: regOtp,
      });
      completeLogin(res.data.token, res.data.client);
    } catch (err: any) {
      addToast({ title: err?.response?.data?.error || "Error al registrarse", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google paso 1: popup de Firebase ──────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await publicService.googleAuth(slug, idToken);

      if (!res.data.needsPhone) {
        // Cuenta existente con phone → login directo
        completeLogin(res.data.token, res.data.client);
        return;
      }

      // Cuenta nueva o sin phone → ir a pedir teléfono
      setGoogleIdToken(idToken);
      if (res.data.token) setGooglePendingToken(res.data.token);
      setStep("google_phone");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") return;
      addToast({ title: err?.response?.data?.error || "Error con Google", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google paso 2: enviar OTP al teléfono ─────────────────────────────────
  const handleGoogleSendOtp = async () => {
    if (!googlePhone.localNumber.trim()) {
      addToast({ title: "Ingresá tu número de teléfono", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.sendOtp(slug, googlePhone.countryCode, googlePhone.localNumber);
      setGoogleMasked(res.data.masked);
      setStep("google_otp");
      addToast({ title: `Código enviado a WhatsApp ***${res.data.masked}`, color: "success" });
    } catch (err: any) {
      addToast({ title: err?.response?.data?.error || "No se pudo enviar el código", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google paso 3: verificar OTP y crear/actualizar cuenta ────────────────
  const handleGoogleVerifyOtp = async () => {
    if (!googleOtp.trim()) {
      addToast({ title: "Ingresá el código de verificación", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.googleAuth(slug, googleIdToken, {
        countryCode: googlePhone.countryCode,
        localNumber: googlePhone.localNumber,
        otp: googleOtp,
      });
      completeLogin(res.data.token, res.data.client);
    } catch (err: any) {
      addToast({ title: err?.response?.data?.error || "Código incorrecto", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOtp = async (flow: "reg" | "google") => {
    const phone = flow === "reg" ? regPhone : googlePhone;
    setIsLoading(true);
    try {
      const res = await publicService.sendOtp(slug, phone.countryCode, phone.localNumber);
      if (flow === "reg") setRegMasked(res.data.masked);
      else setGoogleMasked(res.data.masked);
      addToast({ title: "Código reenviado", color: "success" });
    } catch (err: any) {
      addToast({ title: err?.response?.data?.error || "No se pudo reenviar", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderPhoneStep = (
    phone: PhoneValue,
    setPhone: (v: PhoneValue) => void,
    onSend: () => void,
    onBack: () => void,
  ) => (
    <>
      <ModalHeader className="flex flex-col gap-1">
        <span className="text-lg font-bold">Verificá tu teléfono</span>
        <span className="text-sm text-default-500 font-normal">
          Te enviamos un código por WhatsApp para confirmar que sos vos
        </span>
      </ModalHeader>
      <ModalBody className="pb-6">
        <div className="flex flex-col gap-4">
          <PhoneInput value={phone} onChange={setPhone} isDisabled={isLoading} />
          <p className="text-xs text-default-400">
            Ingresá el número tal como lo tenés en WhatsApp. Para Argentina incluí el 9 antes del área, por ejemplo: <span className="font-medium">9 11 1234-5678</span>
          </p>
          <Button color="primary" onPress={onSend} isLoading={isLoading} fullWidth>
            Enviar código por WhatsApp
          </Button>
          <Button variant="light" size="sm" onPress={onBack} isDisabled={isLoading}>
            Volver
          </Button>
        </div>
      </ModalBody>
    </>
  );

  const renderOtpStep = (
    masked: string,
    otp: string,
    setOtp: (v: string) => void,
    onVerify: () => void,
    onResend: () => void,
    onBack: () => void,
  ) => (
    <>
      <ModalHeader className="flex flex-col gap-1">
        <span className="text-lg font-bold">Ingresá el código</span>
        <span className="text-sm text-default-500 font-normal">
          Te enviamos un código a WhatsApp ***{masked}
        </span>
      </ModalHeader>
      <ModalBody className="pb-6">
        <div className="flex flex-col gap-4">
          <Input
            label="Código de 6 dígitos"
            placeholder="123456"
            value={otp}
            onValueChange={setOtp}
            size="sm"
            maxLength={6}
            inputMode="numeric"
            onKeyDown={(e) => e.key === "Enter" && onVerify()}
            autoFocus
          />
          <Button color="primary" onPress={onVerify} isLoading={isLoading} fullWidth>
            Verificar y continuar
          </Button>
          <div className="flex justify-between">
            <Button variant="light" size="sm" onPress={onBack} isDisabled={isLoading}>
              Volver
            </Button>
            <Button variant="light" size="sm" onPress={onResend} isDisabled={isLoading}>
              Reenviar código
            </Button>
          </div>
        </div>
      </ModalBody>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="sm">
      <ModalContent>
        {step === "reg_phone" &&
          renderPhoneStep(regPhone, setRegPhone, handleRegSendOtp, () => setStep("main"))}

        {step === "reg_otp" &&
          renderOtpStep(
            regMasked, regOtp, setRegOtp,
            handleRegVerifyOtp,
            () => handleResendOtp("reg"),
            () => setStep("reg_phone"),
          )}

        {step === "google_phone" &&
          renderPhoneStep(googlePhone, setGooglePhone, handleGoogleSendOtp, () => setStep("main"))}

        {step === "google_otp" &&
          renderOtpStep(
            googleMasked, googleOtp, setGoogleOtp,
            handleGoogleVerifyOtp,
            () => handleResendOtp("google"),
            () => setStep("google_phone"),
          )}

        {step === "main" && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-bold">Mi cuenta</span>
              <span className="text-sm text-default-500 font-normal">
                Ingresá o creá una cuenta para reservar
              </span>
            </ModalHeader>
            <ModalBody className="pb-6">
              {/* Botón Google */}
              <Button
                variant="bordered"
                fullWidth
                onPress={handleGoogleSignIn}
                isLoading={isLoading}
                startContent={
                  !isLoading && (
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )
                }
              >
                Continuar con Google
              </Button>

              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-default-200" />
                <span className="text-xs text-default-400">o</span>
                <div className="flex-1 h-px bg-default-200" />
              </div>

              <Tabs
                selectedKey={tab}
                onSelectionChange={(k) => setTab(k as "login" | "register")}
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
                    <Button color="primary" onPress={handleLogin} isLoading={isLoading} fullWidth className="mt-1">
                      Ingresar
                    </Button>
                  </div>
                </Tab>

                <Tab key="register" title="Registrarme">
                  <div className="flex flex-col gap-3 mt-2">
                    <Input
                      label="Nombre completo"
                      placeholder="Juan García"
                      value={regForm.name}
                      onValueChange={(v) => setRegForm((p) => ({ ...p, name: v }))}
                      size="sm"
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="tu@email.com"
                      value={regForm.email}
                      onValueChange={(v) => setRegForm((p) => ({ ...p, email: v }))}
                      size="sm"
                    />
                    <Input
                      label="Contraseña"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={regForm.password}
                      onValueChange={(v) => setRegForm((p) => ({ ...p, password: v }))}
                      size="sm"
                    />
                    <Input
                      label="Confirmar contraseña"
                      type="password"
                      placeholder="Repetí tu contraseña"
                      value={regForm.confirmPassword}
                      onValueChange={(v) => setRegForm((p) => ({ ...p, confirmPassword: v }))}
                      size="sm"
                    />
                    <Button
                      color="primary"
                      onPress={handleRegNextToPhone}
                      isDisabled={isLoading}
                      fullWidth
                      className="mt-1"
                    >
                      Siguiente →
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
