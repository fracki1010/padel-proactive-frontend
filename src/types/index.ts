export interface Court {
  _id: string;
  name: string;
  courtType?: string;
  surface?: string;
  isIndoor?: boolean;
  isActive?: boolean;
}

export interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface FixedTurn {
  court: string | Court;
  dayOfWeek: number;
  timeSlot: string | TimeSlot;
}

export interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  fixedTurns?: FixedTurn[];
  whatsappId?: string;
  penalties?: number;
  isSuspended?: boolean;
  attendanceConfirmedCount?: number;
  trustedClientConfirmationCount?: number;
  confirmationsToBeTrusted?: number;
  isTrustedClient?: boolean;
  accountOrigin?: "whatsapp" | "sistema" | "google";
}

export interface Booking {
  _id: string;
  court: Court;
  date: string;
  timeSlot: TimeSlot;
  clientName: string;
  clientPhone: string;
  status:
    | "reservado"
    | "confirmado"
    | "cancelado"
    | "suspendido"
    | "disponible";
  paymentStatus?: "pagado" | "pendiente";
  finalPrice: number;
  isFixed?: boolean;
  createdAt: string;
}

export interface BookingsResponse {
  success: boolean;
  count: number;
  data: Booking[];
}

export interface ClubClosure {
  _id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ConfigResponse<T> {
  success: boolean;
  data: T[];
}
