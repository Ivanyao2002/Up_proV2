import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

interface ApiVehiclePerformanceItem {
  id: string;
  vehicle_id?: string;
  brand?: string | null;
  model?: string | null;
  plate?: string | null;
  plate_number?: string | null;
  total_km?: number;
  trips_count?: number;
  revenue_fcfa?: number;
  acceptance_rate_pct?: number;
  avg_rating?: number;
  period?: string;
  partner_id?: string;
  driver_id?: string | null;
  manufacture_year?: number | null;
  metadata?: {
    brand?: string;
    model?: string;
    category?: string;
  };
}

interface PerformanceApiResponse<T> {
  status: string;
  items?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapApiVehicleToPerformance(item: ApiVehiclePerformanceItem): VehiclePerformance {
  const brand = item.brand ?? item.metadata?.brand ?? "—";
  const model = item.model ?? item.metadata?.model ?? "";
  const plate = item.plate ?? item.plate_number ?? undefined;

  return {
    id: item.id,
    vehicle_id: item.vehicle_id ?? item.id,
    brand: brand || "—",
    model: model,
    plate: plate || undefined,
    total_km: item.total_km ?? 0,
    trips_count: item.trips_count ?? 0,
    revenue_fcfa: item.revenue_fcfa ?? 0,
    acceptance_rate_pct: item.acceptance_rate_pct ?? 0,
    avg_rating: item.avg_rating ?? 0,
    period: item.period ?? "N/A",
  };
}

function mapVehiclePerformanceResponse(
  response: PerformanceApiResponse<ApiVehiclePerformanceItem>
): Paginated<VehiclePerformance> {
  if ("status" in response && response.status === "ok" && response.items) {
    const data = response.items.map(item => mapApiVehicleToPerformance(item));
    
    return {
      data,
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

interface ApiDriverPerformanceItem {
  id: string;
  driver_id?: string;
  user_id?: string;
  driver_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  displayName?: string | null;
  phone?: string | null;
  profile?: {
    firstName?: string | null;
    first_name?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    displayName?: string | null;
    display_name?: string | null;
    phone?: string | null;
  };
  trips_completed?: number;
  trips_count?: number;
  trips_cancelled?: number;
  revenue_fcfa?: number;
  revenue_xof?: number;
  avg_rating?: number;
  acceptance_rate_pct?: number;
  cancellation_rate_pct?: number;
  period?: string;
  metadata?: Record<string, unknown>;
}

function mapApiDriverToPerformance(item: ApiDriverPerformanceItem): DriverPerformance {
  const p = item.profile ?? {};
  const driverId = item.driver_id ?? item.user_id ?? item.id;

  const firstName =
    item.first_name ??
    p.firstName ?? p.first_name ??
    p.display_name ?? (item.displayName as string | null) ??
    `ID: ${driverId.toString().slice(-8).toUpperCase()}`;

  const lastName = item.last_name ?? p.lastName ?? p.last_name ?? "";

  return {
    id: item.id,
    driver_id: driverId,
    first_name: firstName,
    last_name: lastName,
    trips_completed: item.trips_completed ?? item.trips_count ?? 0,
    trips_cancelled: item.trips_cancelled ?? 0,
    revenue_fcfa: item.revenue_fcfa ?? item.revenue_xof ?? 0,
    avg_rating: item.avg_rating ?? 0,
    acceptance_rate_pct: item.acceptance_rate_pct ?? 0,
    cancellation_rate_pct: item.cancellation_rate_pct ?? 0,
    period: item.period ?? "N/A",
  };
}

function mapDriverPerformanceResponse(
  response: PerformanceApiResponse<ApiDriverPerformanceItem> | Paginated<ApiDriverPerformanceItem>
): Paginated<DriverPerformance> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items.map(mapApiDriverToPerformance),
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return {
      data: (response.data as ApiDriverPerformanceItem[]).map(mapApiDriverToPerformance),
      meta: response.meta,
    };
  }
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

export interface VehiclePerformance {
  id: string;
  vehicle_id: string;
  brand: string;
  model: string;
  plate?: string;
  total_km: number;
  trips_count: number;
  revenue_fcfa: number;
  acceptance_rate_pct: number;
  avg_rating: number;
  period: string;
}

export interface DriverPerformance {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  trips_completed: number;
  trips_cancelled: number;
  revenue_fcfa: number;
  avg_rating: number;
  acceptance_rate_pct: number;
  cancellation_rate_pct: number;
  period: string;
}

export const partnerPerformanceService = {
  vehicles: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<PerformanceApiResponse<ApiVehiclePerformanceItem>>(
      `${LINKS.partner.vehicles.performance(partnerId)}${buildListQuery(params)}`
    );
    return mapVehiclePerformanceResponse(response);
  },

  drivers: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<PerformanceApiResponse<ApiDriverPerformanceItem>>(
      `${LINKS.partner.vehicles.driverPerformance(partnerId)}${buildListQuery(params)}`
    );
    return mapDriverPerformanceResponse(response);
  },
};
