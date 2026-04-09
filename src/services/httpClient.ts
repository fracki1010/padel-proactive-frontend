import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api";

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (
  handler: UnauthorizedHandler | null,
) => {
  unauthorizedHandler = handler;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || "");
    const isLoginRequest = url.includes("/auth/login");
    const isWhatsappConfigRequest = url.includes("/config/whatsapp");

    // Some backends can use 401 on WhatsApp status when the device session ends.
    // That should not invalidate the panel auth token.
    if (
      status === 401 &&
      !isLoginRequest &&
      !isWhatsappConfigRequest &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;

      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
      }

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 0);
    }

    return Promise.reject(error);
  },
);
