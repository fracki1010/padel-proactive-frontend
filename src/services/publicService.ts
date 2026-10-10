import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api";

type UnauthorizedHandler = () => void;
let clientUnauthorizedHandler: UnauthorizedHandler | null = null;

export const setClientUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  clientUnauthorizedHandler = handler;
};

// Instancia sin interceptor de auth de admin
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Inyecta token de cliente si existe
publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("padexa:client_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Limpia la sesión del cliente si el token expiró o es inválido
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && clientUnauthorizedHandler) {
      clientUnauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

// Deposit (seña) state attached to a booking when the club has deposits enabled.
export type DepositStatus =
  | "pendiente"
  | "pagado"
  | "expirado"
  | "refund_pending"
  | "reembolsado";

export interface BookingDeposit {
  required: boolean;
  status: DepositStatus;
  amount: number;
  expiresAt: string | null;
  refundable?: boolean;
  method?: "transfer" | "mercadopago";
}

export interface BookingPayment {
  initPoint: string;
}

export interface BookingTransfer {
  amount: number;
  alias: string;
  cbu: string;
  holder: string;
}

export interface CreatedBooking {
  _id: string;
  status: string;
  deposit?: BookingDeposit;
  payment?: BookingPayment;
  transfer?: BookingTransfer;
  [key: string]: unknown;
}

export interface PaymentLinkResponse {
  initPoint: string;
  preferenceId?: string;
  amount?: number;
}

export const publicService = {
  getClubInfo: async (slug: string) => {
    const res = await publicApi.get(`/public/${slug}`);
    return res.data;
  },

  getAvailability: async (slug: string, date: string, holderId?: string) => {
    const res = await publicApi.get(`/public/${slug}/availability`, {
      params: { date, ...(holderId ? { holderId } : {}) },
    });
    return res.data;
  },

  acquireSlotLock: async (
    slug: string,
    payload: { courtId: string; slotId: string; date: string; holderId: string },
  ) => {
    const res = await publicApi.post(`/public/${slug}/slot-lock`, payload);
    return res.data;
  },

  releaseSlotLock: async (slug: string, lockId: string, holderId: string) => {
    const res = await publicApi.delete(`/public/${slug}/slot-lock/${lockId}`, {
      params: { holderId },
    });
    return res.data;
  },

  getAnnouncements: async (slug: string) => {
    const res = await publicApi.get(`/public/${slug}/announcements`);
    return res.data;
  },

  sendOtp: async (slug: string, countryCode: string, localNumber: string, googleFlow?: boolean) => {
    const res = await publicApi.post(`/public/${slug}/auth/send-otp`, { countryCode, localNumber, ...(googleFlow && { googleFlow: true }) });
    return res.data;
  },

  verifyOtp: async (slug: string, payload: { countryCode: string; localNumber: string; otp: string }) => {
    const res = await publicApi.post(`/public/${slug}/auth/verify-otp`, payload);
    return res.data;
  },

  completeRegistration: async (slug: string, payload: { name: string; countryCode: string; localNumber: string; otp: string }) => {
    const res = await publicApi.post(`/public/${slug}/auth/complete-registration`, payload);
    return res.data;
  },

  getMe: async (slug: string) => {
    const res = await publicApi.get(`/public/${slug}/auth/me`);
    return res.data;
  },

  createBooking: async (
    slug: string,
    payload: { courtId: string; slotId: string; date: string; holderId?: string },
  ): Promise<{ success: boolean; data: CreatedBooking }> => {
    const res = await publicApi.post(`/public/${slug}/bookings`, payload);
    return res.data;
  },

  // Mints a fresh Checkout Pro preference for a pending deposit. The backend
  // returns 409 (code `DEPOSIT_EXPIRED`) when the hold already lapsed or was
  // paid, so callers must handle that briefly.
  regeneratePaymentLink: async (
    slug: string,
    bookingId: string,
  ): Promise<{ success: boolean; data: PaymentLinkResponse }> => {
    const res = await publicApi.post(`/public/${slug}/bookings/${bookingId}/payment-link`);
    return res.data;
  },

  getMyBookings: async (slug: string) => {
    const res = await publicApi.get(`/public/${slug}/bookings`);
    return res.data;
  },

  cancelBooking: async (slug: string, bookingId: string) => {
    const res = await publicApi.delete(`/public/${slug}/bookings/${bookingId}`);
    return res.data;
  },

  googleAuth: async (slug: string, idToken: string, phonePayload?: { countryCode: string; localNumber: string; otp: string }) => {
    const res = await publicApi.post(`/public/${slug}/auth/google`, { idToken, ...phonePayload });
    return res.data;
  },

  updatePhone: async (slug: string, payload: { countryCode: string; localNumber: string; otp: string }) => {
    const res = await publicApi.put(`/public/${slug}/auth/me/phone`, payload);
    return res.data;
  },
};
