import axios from "axios";
import type {
  BookingsResponse,
  ConfigResponse,
  Court,
  TimeSlot,
} from "../types";

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

// Interceptor para añadir el token en cada request
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

    if (status === 401 && !isLoginRequest && !isHandlingUnauthorized) {
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

export const authService = {
  updateProfile: async (data: { username?: string; phone?: string }) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};

export const bookingService = {
  getBookings: async (date?: string): Promise<BookingsResponse> => {
    const url = date ? `/bookings?date=${date}` : "/bookings";
    const response = await api.get(url);
    return response.data;
  },

  createBooking: async (bookingData: any) => {
    const response = await api.post("/bookings", bookingData);
    return response.data;
  },

  deleteBooking: async (id: string) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  updateBooking: async (id: string, data: any) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },
};

export const configService = {
  getCourts: async (all = false): Promise<ConfigResponse<Court>> => {
    const response = await api.get(`/config/courts${all ? "?all=true" : ""}`);
    return response.data;
  },

  createCourt: async (data: Partial<Court>): Promise<any> => {
    const response = await api.post("/config/courts", data);
    return response.data;
  },

  updateCourt: async (id: string, data: Partial<Court>): Promise<any> => {
    const response = await api.put(`/config/courts/${id}`, data);
    return response.data;
  },

  getSlots: async (all = false): Promise<ConfigResponse<TimeSlot>> => {
    const response = await api.get(`/config/slots${all ? "?all=true" : ""}`);
    return response.data;
  },

  createSlot: async (data: Partial<TimeSlot> & { startTime: string; endTime: string; price: number }): Promise<any> => {
    const response = await api.post("/config/slots", data);
    return response.data;
  },

  updateSlot: async (id: string, data: Partial<TimeSlot>): Promise<any> => {
    const response = await api.put(`/config/slots/${id}`, data);
    return response.data;
  },

  updateBasePrice: async (price: number): Promise<any> => {
    const response = await api.put("/config/slots/base-price", { price });
    return response.data;
  },

  getWhatsappStatus: async (): Promise<any> => {
    const response = await api.get("/config/whatsapp");
    return response.data;
  },

  updateWhatsappStatus: async (enabled: boolean): Promise<any> => {
    const response = await api.put("/config/whatsapp", { enabled });
    return response.data;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put("/notifications/mark-all-read");
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
};

export const userService = {
  getUsers: async (): Promise<any> => {
    const response = await api.get("/users");
    return response.data;
  },
  createUser: async (data: any): Promise<any> => {
    const response = await api.post("/users", data);
    return response.data;
  },
  updateUser: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string): Promise<any> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  getUserHistory: async (id: string): Promise<any> => {
    const response = await api.get(`/users/${id}/history`);
    return response.data;
  },
  clearPenalties: async (id: string): Promise<any> => {
    const response = await api.post(`/users/${id}/clear-penalties`);
    return response.data;
  },
};

export const superAdminService = {
  listCompanies: async (): Promise<any> => {
    const response = await api.get("/super-admin/companies");
    return response.data;
  },
  createCompany: async (data: { name: string; slug?: string }): Promise<any> => {
    const response = await api.post("/super-admin/companies", data);
    return response.data;
  },
  updateCompanyStatus: async (id: string, isActive: boolean): Promise<any> => {
    const response = await api.put(`/super-admin/companies/${id}/status`, {
      isActive,
    });
    return response.data;
  },
  listAdmins: async (): Promise<any> => {
    const response = await api.get("/super-admin/admins");
    return response.data;
  },
  createAdmin: async (data: {
    username: string;
    password: string;
    phone?: string;
    companyId: string;
    role?: "admin" | "manager";
  }): Promise<any> => {
    const response = await api.post("/super-admin/admins", data);
    return response.data;
  },
  updateAdminStatus: async (id: string, isActive: boolean): Promise<any> => {
    const response = await api.put(`/super-admin/admins/${id}/status`, {
      isActive,
    });
    return response.data;
  },
  bootstrapDefaultTenant: async (data: {
    name: string;
    slug?: string;
    assignAllUnassignedData?: boolean;
    assignAllUnassignedAdmins?: boolean;
  }): Promise<any> => {
    const response = await api.post("/super-admin/bootstrap/default-tenant", data);
    return response.data;
  },
};
