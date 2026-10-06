import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { firebaseAuth, googleProvider } from "../../../lib/firebase";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { publicService } from "../../../services/publicService";
import { PhoneInput, defaultPhone } from "./PhoneInput";
import type { PhoneValue } from "./PhoneInput";
import { normalizePhoneForApi } from "../../../utils/phone";
import { fieldInputClassNames } from "../../../components/ui/fieldStyles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onSuccess?: () => void;
}

interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Pasos del modal
type Step =
  | "phone"        // ingresar número de WhatsApp
  | "otp"          // ingresar código
  | "name"         // número nuevo: completar nombre
  | "google_phone" // google sin teléfono verificado: pedir teléfono
  | "google_otp";  // google sin teléfono verificado: ingresar código

const getErrorMessage = (err: unknown, fallback: string) => {
  const apiError = err as { response?: { data?: { error?: string } } };
  return apiError?.response?.data?.error || fallback;
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const ClientAuthModal = ({ isOpen, onClose, slug, onSuccess }: Props) => {
  const { loginClient } = useClientAuth();
  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);

  // Flujo WhatsApp
  const [phone, setPhone] = useState<PhoneValue>(defaultPhone());
  const [masked, setMasked] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  // Flujo Google (solo para cuentas sin teléfono verificado)
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [googlePhone, setGooglePhone] = useState<PhoneValue>(defaultPhone());
  const [googleMasked, setGoogleMasked] = useState("");
  const [googleOtp, setGoogleOtp] = useState("");

  const reset = () => {
    setStep("phone");
    setPhone(defaultPhone());
    setMasked("");
    setOtp("");
    setName("");
    setGoogleIdToken("");
    setGooglePhone(defaultPhone());
    setGoogleMasked("");
    setGoogleOtp("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const completeLogin = (token: string, client: ClientUser) => {
    loginClient(token, client);
    addToast({ title: `Bienvenido/a, ${client.name}`, color: "success" });
    reset();
    onClose();
    onSuccess?.();
  };

  // ─── WhatsApp paso 1: enviar OTP ────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!phone.localNumber.trim()) {
      addToast({ title: "Ingresá tu número de WhatsApp", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { countryCode, localNumber } = normalizePhoneForApi(phone.countryCode, phone.localNumber);
      const res = await publicService.sendOtp(slug, countryCode, localNumber);
      setMasked(res.data.masked);
      setStep("otp");
      addToast({ title: `Código enviado a WhatsApp ***${res.data.masked}`, color: "success" });
    } catch (err) {
      addToast({ title: getErrorMessage(err, "No se pudo enviar el código"), color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── WhatsApp paso 2: verificar OTP ─────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      addToast({ title: "Ingresá el código de verificación", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { countryCode, localNumber } = normalizePhoneForApi(phone.countryCode, phone.localNumber);
      const res = await publicService.verifyOtp(slug, { countryCode, localNumber, otp });
      if (res.data.needsName) {
        setStep("name");
        return;
      }
      completeLogin(res.data.token, res.data.client);
    } catch (err) {
      addToast({ title: getErrorMessage(err, "Código incorrecto"), color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── WhatsApp paso 3: completar registro con el nombre ─────────────────────
  const handleCompleteRegistration = async () => {
    if (!name.trim()) {
      addToast({ title: "Ingresá tu nombre y apellido", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { countryCode, localNumber } = normalizePhoneForApi(phone.countryCode, phone.localNumber);
      const res = await publicService.completeRegistration(slug, {
        name,
        countryCode,
        localNumber,
        otp,
      });
      completeLogin(res.data.token, res.data.client);
    } catch (err) {
      addToast({ title: getErrorMessage(err, "No se pudo completar el registro"), color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendWhatsappOtp = async () => {
    setIsLoading(true);
    try {
      const { countryCode, localNumber } = normalizePhoneForApi(phone.countryCode, phone.localNumber);
      const res = await publicService.sendOtp(slug, countryCode, localNumber);
      setMasked(res.data.masked);
      addToast({ title: "Código reenviado", color: "success" });
    } catch (err) {
      addToast({ title: getErrorMessage(err, "No se pudo reenviar"), color: "danger" });
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
        completeLogin(res.data.token, res.data.client);
        return;
      }

      // Cuenta de Google sin teléfono verificado → debe verificar con OTP
      setGoogleIdToken(idToken);
      setStep("google_phone");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      addToast({ title: getErrorMessage(err, "Error con Google"), color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google paso 2: enviar OTP ─────────────────────────────────────────────
  const handleGoogleSendOtp = async () => {
    if (!googlePhone.localNumber.trim()) {
      addToast({ title: "Ingresá tu número de teléfono", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { countryCode, localNumber } = normalizePhoneForApi(googlePhone.countryCode, googlePhone.localNumber);
      const res = await publicService.sendOtp(slug, countryCode, localNumber, true);
      setGoogleMasked(res.data.masked);
      setStep("google_otp");
      addToast({ title: `Código enviado a WhatsApp ***${res.data.masked}`, color: "success" });
    } catch (err) {
      addToast({ title: getErrorMessage(err, "No se pudo enviar el código"), color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google paso 3: verificar OTP ──────────────────────────────────────────
  const handleGoogleVerifyOtp = async () => {
    if (!googleOtp.trim()) {
      addToast({ title: "Ingresá el código de verificación", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const { countryCode, localNumber } = normalizePhoneForApi(googlePhone.countryCode, googlePhone.localNumber);
      const res = await publicService.googleAuth(slug, googleIdToken, {
        countryCode,
        localNumber,
        otp: googleOtp,
      });
      completeLogin(res.data.token, res.data.client);
    } catch (err) {
      addToast({ title: getErrorMessage(err, "Código incorrecto"), color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="sm">
      <ModalContent>
        {step === "phone" && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-bold">Mi cuenta</span>
              <span className="text-sm text-default-500 font-normal">
                Entrá con tu número de WhatsApp para reservar
              </span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="flex flex-col gap-4">
                <PhoneInput value={phone} onChange={setPhone} isDisabled={isLoading} />
                <p className="text-xs text-default-400">
                  Ingresá el número tal como lo tenés en WhatsApp. Te enviamos un código para confirmar que sos vos.
                </p>
                <Button color="primary" onPress={handleSendOtp} isLoading={isLoading} fullWidth>
                  Enviar código
                </Button>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-default-200" />
                  <span className="text-xs text-default-400">o</span>
                  <div className="flex-1 h-px bg-default-200" />
                </div>

                <Button
                  variant="bordered"
                  fullWidth
                  onPress={handleGoogleSignIn}
                  isLoading={isLoading}
                  startContent={!isLoading && <GoogleIcon />}
                >
                  Entrar con Google
                </Button>
              </div>
            </ModalBody>
          </>
        )}

        {step === "otp" && (
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
                  classNames={fieldInputClassNames.sm}
                  maxLength={6}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  autoFocus
                />
                <Button color="primary" onPress={handleVerifyOtp} isLoading={isLoading} fullWidth>
                  Entrar
                </Button>
                <div className="flex justify-between">
                  <Button variant="light" size="sm" onPress={() => setStep("phone")} isDisabled={isLoading}>
                    Volver
                  </Button>
                  <Button variant="light" size="sm" onPress={handleResendWhatsappOtp} isDisabled={isLoading}>
                    Reenviar código
                  </Button>
                </div>
              </div>
            </ModalBody>
          </>
        )}

        {step === "name" && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-bold">Completá tu registro</span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-warning-600 bg-warning-50 rounded-medium px-3 py-2">
                  ⚠️ Ingresá tu nombre y apellido real — así te identificamos y te encontramos en el club
                </p>
                <Input
                  label="Nombre y apellido"
                  placeholder="Juan García"
                  value={name}
                  onValueChange={setName}
                  size="sm"
                  classNames={fieldInputClassNames.sm}
                  onKeyDown={(e) => e.key === "Enter" && handleCompleteRegistration()}
                  autoFocus
                />
                <Button
                  color="primary"
                  onPress={handleCompleteRegistration}
                  isLoading={isLoading}
                  fullWidth
                >
                  Crear cuenta y entrar
                </Button>
                <Button variant="light" size="sm" onPress={() => setStep("otp")} isDisabled={isLoading}>
                  Volver
                </Button>
              </div>
            </ModalBody>
          </>
        )}

        {step === "google_phone" && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-bold">Verificá tu teléfono</span>
              <span className="text-sm text-default-500 font-normal">
                Para entrar con Google necesitamos verificar tu número por WhatsApp
              </span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="flex flex-col gap-4">
                <PhoneInput value={googlePhone} onChange={setGooglePhone} isDisabled={isLoading} />
                <Button color="primary" onPress={handleGoogleSendOtp} isLoading={isLoading} fullWidth>
                  Enviar código
                </Button>
                <Button variant="light" size="sm" onPress={() => setStep("phone")} isDisabled={isLoading}>
                  Volver
                </Button>
              </div>
            </ModalBody>
          </>
        )}

        {step === "google_otp" && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-lg font-bold">Ingresá el código</span>
              <span className="text-sm text-default-500 font-normal">
                Te enviamos un código a WhatsApp ***{googleMasked}
              </span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="flex flex-col gap-4">
                <Input
                  label="Código de 6 dígitos"
                  placeholder="123456"
                  value={googleOtp}
                  onValueChange={setGoogleOtp}
                  size="sm"
                  classNames={fieldInputClassNames.sm}
                  maxLength={6}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && handleGoogleVerifyOtp()}
                  autoFocus
                />
                <Button color="primary" onPress={handleGoogleVerifyOtp} isLoading={isLoading} fullWidth>
                  Verificar y entrar
                </Button>
                <Button variant="light" size="sm" onPress={() => setStep("google_phone")} isDisabled={isLoading}>
                  Volver
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
