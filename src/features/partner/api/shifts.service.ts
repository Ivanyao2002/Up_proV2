import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";

export interface PartnerShift {
  id: number;
  driver_name: string;
  vehicle_label: string;
  day_label: string;
  start_time: string;
  end_time: string;
  status: "active" | "draft";
}

export interface RecurringBooking {
  id: string;
  client_name: string;
  from_label: string;
  to_label: string;
  frequency: "daily" | "weekly" | "monthly";
  weekdays: string[];
  time: string;
  amount_fcfa: number;
  status: "active" | "paused";
  next_occurrence_at: string | null;
}

export interface PartnerReport {
  id: string;
  period_label: string;
  trips_count: number;
  revenue_fcfa: number;
  acceptance_rate_pct: number;
  generated_at: string;
}

export const partnerShiftsService = {
  list: () => apiClient.get<Paginated<PartnerShift>>("/partner/shifts"),
};

export const partnerRecurringService = {
  list: () =>
    apiClient.get<Paginated<RecurringBooking>>("/partner/bookings/recurring"),
};

export const partnerReportsService = {
  list: () => apiClient.get<Paginated<PartnerReport>>("/partner/reports"),
};
