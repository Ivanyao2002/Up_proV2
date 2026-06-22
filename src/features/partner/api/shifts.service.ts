import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

interface ApiListResponse<T> {
  status?: string;
  items?: T[];
  data?: T[];
  pagination?: { page: number; limit: number; total: number; hasMore?: boolean };
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
}

function mapApiList<T>(res: ApiListResponse<T>): Paginated<T> {
  if (res.meta && res.data) return res as Paginated<T>;
  const items = res.items ?? res.data ?? [];
  const p = res.pagination;
  return {
    data: items,
    meta: p
      ? {
          current_page: p.page,
          last_page: p.hasMore ? p.page + 1 : p.page,
          per_page: p.limit,
          total: p.total,
        }
      : { current_page: 1, last_page: 1, per_page: items.length || 20, total: items.length },
  };
}

export interface PartnerShift {
  id: number;
  driver_name: string;
  vehicle_label: string;
  day_label: string;
  start_time: string;
  end_time: string;
  status: "active" | "draft";
}

export interface CreateShiftPayload {
  driver_name: string;
  vehicle_label: string;
  day_label: string;
  start_time: string;
  end_time: string;
  status?: "active" | "draft";
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
  list: async (partnerId: string | number, params?: ListParams) => {
    const res = await apiClient.get<ApiListResponse<PartnerShift>>(
      `${LINKS.partner.shifts.list(partnerId)}${buildListQuery(params)}`
    );
    return mapApiList(res);
  },

  create: async (partnerId: string | number, data: CreateShiftPayload) => {
    const res = await apiClient.post<PartnerShift>(
      LINKS.partner.shifts.list(partnerId),
      data
    );
    return res;
  },
};

export const partnerRecurringService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const res = await apiClient.get<ApiListResponse<RecurringBooking>>(
      `${LINKS.partner.bookings.recurring.list(partnerId)}${buildListQuery(params)}`
    );
    return mapApiList(res);
  },
};

export const partnerReportsService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const res = await apiClient.get<ApiListResponse<PartnerReport>>(
      `${LINKS.partner.reports.list(partnerId)}${buildListQuery(params)}`
    );
    return mapApiList(res);
  },
};
