import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api";

type UnauthorizedHandler = () => void;

// Default 401 handling: NEVER reload the page. Clear the stored session and
// notify the app so it can react (AuthContext listens and logs out). AuthContext
// overrides this with its own handler after mount; the event channel stays alive
// for requests that race ahead of that registration.
const defaultUnauthorizedHandler: UnauthorizedHandler = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth:unauthorized"));
};
let unauthorizedHandler: UnauthorizedHandler = defaultUnauthorizedHandler;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (
  handler: UnauthorizedHandler | null,
) => {
  unauthorizedHandler = handler ?? defaultUnauthorizedHandler;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
      unauthorizedHandler();

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 0);
    }

    return Promise.reject(error);
  },
);
