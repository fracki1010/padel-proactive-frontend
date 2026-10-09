import { api } from "./httpClient";

export type FixedBookingStatus = "active" | "paused";

export interface FixedBookingCourtRef {
  _id: string;
  name: string;
}

export interface FixedBookingSlotRef {
  _id: string;
  startTime: string;
  endTime: string;
  order?: number;
  label?: string;
}

export interface FixedBooking {
  _id: string;
  court: FixedBookingCourtRef | string;
  timeSlot: FixedBookingSlotRef | string;
  weekday: number;
  clientName: string;
  notes: string;
  status: FixedBookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface FixedBookingPayload {
  court: string;
  timeSlot: string;
  weekday: number;
  clientName?: string;
  notes?: string;
  status?: FixedBookingStatus;
}

export interface FixedBookingListParams {
  weekday?: number;
  status?: FixedBookingStatus;
}

export interface FixedBookingListResponse {
  success: boolean;
  data: FixedBooking[];
}

export const fixedBookingService = {
  listFixedBookings: async (
    params: FixedBookingListParams = {},
  ): Promise<FixedBookingListResponse> => {
    const response = await api.get("/fixed-bookings", { params });
    return response.data;
  },

  createFixedBooking: async (
    payload: FixedBookingPayload,
  ): Promise<FixedBooking> => {
    const response = await api.post("/fixed-bookings", payload);
    return response.data?.data;
  },

  updateFixedBooking: async (
    id: string,
    payload: Partial<FixedBookingPayload>,
  ): Promise<FixedBooking> => {
    const response = await api.put(`/fixed-bookings/${id}`, payload);
    return response.data?.data;
  },

  deleteFixedBooking: async (id: string): Promise<void> => {
    await api.delete(`/fixed-bookings/${id}`);
  },
};
