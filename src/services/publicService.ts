import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api";

// Instancia sin interceptor de auth de admin
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

// Inyecta token de cliente si existe
publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("padexa:client_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const publicService = {
  getClubInfo: async (slug: string) => {
    const res = await publicApi.get(`/public/${slug}`);
    return res.data;
  },

  getAvailability: async (slug: string, date: string) => {
    const res = await publicApi.get(`/public/${slug}/availability`, { params: { date } });
    return res.data;
  },

  sendOtp: async (slug: string, countryCode: string, localNumber: string, googleFlow?: boolean) => {
    const res = await publicApi.post(`/public/${slug}/auth/send-otp`, { countryCode, localNumber, ...(googleFlow && { googleFlow: true }) });
    return res.data;
  },

  register: async (slug: string, payload: { name: string; email: string; countryCode: string; localNumber: string; password: string; otp: string }) => {
    const res = await publicApi.post(`/public/${slug}/auth/register`, payload);
    return res.data;
  },

  login: async (slug: string, payload: { email: string; password: string }) => {
    const res = await publicApi.post(`/public/${slug}/auth/login`, payload);
    return res.data;
  },

  getMe: async (slug: string) => {
    const res = await publicApi.get(`/public/${slug}/auth/me`);
    return res.data;
  },

  createBooking: async (slug: string, payload: { courtId: string; slotId: string; date: string }) => {
    const res = await publicApi.post(`/public/${slug}/bookings`, payload);
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
