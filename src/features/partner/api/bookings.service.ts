import { apiClient } from "@/core/http/apiClient";
import type { Paginated, TripStatus, TripTimelineEvent } from "@/shared/types";

export interface CreateBookingPayload {
  from_label: string;
  to_label: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  client_name: string;
  client_phone: string;
  service: "taxi" | "delivery";
  payment_method: "cash" | "wallet" | "orange_money";
  scheduled_at?: string;
  notes?: string;
}

export interface PartnerBooking {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  from_lat?: number;
  from_lng?: number;
  to_lat?: number;
  to_lng?: number;
  client_name: string;
  client_phone?: string;
  service?: "taxi" | "delivery";
  payment_method?: CreateBookingPayload["payment_method"];
  status: TripStatus;
  amount_fcfa: number;
  driver_id?: number;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  created_at: string;
}

export interface PartnerBookingDetail extends PartnerBooking {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  timeline: TripTimelineEvent[];
  estimated_arrival_at?: string | null;
}

export interface BookingCreated extends PartnerBooking {
  estimated_amount_fcfa: number;
}

export const partnerBookingsService = {
  list: () => apiClient.get<Paginated<PartnerBooking>>("/partner/bookings"),

  getById: (id: string) => apiClient.get<PartnerBookingDetail>(`/partner/bookings/${id}`),

  create: (data: CreateBookingPayload) =>
    apiClient.post<BookingCreated>("/partner/bookings", data),

  cancel: (id: string) =>
    apiClient.post<{ ok: boolean; message: string; booking: PartnerBookingDetail }>(
      `/partner/bookings/${id}/cancel`
    ),
};
