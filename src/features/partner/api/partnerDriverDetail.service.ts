import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { LiveMapData, LiveMapDriver, Paginated, TripStatus } from "@/shared/types";
import {
  mapApiPartnerLiveMapToData,
  type ApiPartnerLiveMapResponse,
} from "./partnerLiveMap.mapper";

export interface PartnerDriverTripRow {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
}

export interface PartnerDriverWalletTransaction {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount_fcfa: number;
  balance_after_fcfa: number;
  created_at: string;
}

export interface PartnerDriverLiveMap {
  driver: LiveMapDriver;
  bounds: LiveMapData["bounds"];
  zone_name: string;
  city: string;
  updated_at: string;
}

interface TripsApiResponse {
  status?: string;
  items?: Array<{
    id: string;
    order_reference?: string;
    pickup_address?: string;
    dropoff_address?: string;
    status?: string;
    estimated_price_xof?: number;
    final_price_xof?: number | null;
    created_at?: string;
  }>;
  data?: PartnerDriverTripRow[];
  pagination?: { page: number; limit: number; total: number; hasMore: boolean };
  meta?: { current_page: number; per_page: number; total: number; last_page: number };
}

interface WalletTxApiResponse {
  status?: string;
  items?: PartnerDriverWalletTransaction[];
  data?: PartnerDriverWalletTransaction[];
  pagination?: { page: number; limit: number; total: number; hasMore: boolean };
  meta?: { current_page: number; per_page: number; total: number; last_page: number };
}

export const partnerDriverDetailService = {
  getTrips: async (partnerId: string | number, driverId: string) => {
    const raw = await apiClient.get<TripsApiResponse>(
      LINKS.partner.drivers.trips(partnerId, driverId)
    );
    // Format {status:"ok", items, pagination}
    if (raw.status === "ok" && Array.isArray(raw.items)) {
      const p = raw.pagination;
      const rows: PartnerDriverTripRow[] = raw.items.map((t) => ({
        id: t.id,
        ref: t.order_reference ?? t.id.slice(0, 8).toUpperCase(),
        from_label: t.pickup_address ?? "—",
        to_label: t.dropoff_address ?? "—",
        status: (t.status ?? "cancelled") as import("@/shared/types").TripStatus,
        amount_fcfa: t.final_price_xof ?? t.estimated_price_xof ?? 0,
        created_at: t.created_at ?? "",
      }));
      return {
        data: rows,
        meta: p
          ? { current_page: p.page, per_page: p.limit, total: p.total, last_page: p.hasMore ? p.page + 1 : p.page }
          : { current_page: 1, per_page: 20, total: rows.length, last_page: 1 },
      } as Paginated<PartnerDriverTripRow>;
    }
    // Format standard {data, meta}
    if (Array.isArray(raw.data)) return raw as Paginated<PartnerDriverTripRow>;
    return { data: [], meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 } } as Paginated<PartnerDriverTripRow>;
  },

  getWalletTransactions: async (partnerId: string | number, driverId: string) => {
    const raw = await apiClient.get<WalletTxApiResponse>(
      LINKS.partner.drivers.walletTransactions(partnerId, driverId)
    );
    if (raw.status === "ok" && Array.isArray(raw.items)) {
      const p = raw.pagination;
      return {
        data: raw.items,
        meta: p
          ? { current_page: p.page, per_page: p.limit, total: p.total, last_page: p.hasMore ? p.page + 1 : p.page }
          : { current_page: 1, per_page: 20, total: raw.items.length, last_page: 1 },
      } as Paginated<PartnerDriverWalletTransaction>;
    }
    if (Array.isArray(raw.data)) return raw as Paginated<PartnerDriverWalletTransaction>;
    return { data: [], meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 } } as Paginated<PartnerDriverWalletTransaction>;
  },

  getLivePosition: async (partnerId: string | number, driverId: string) => {
    const raw = await apiClient.get<{
      driver_id?: string;
      latitude?: number;
      longitude?: number;
      heading?: number | null;
      speed_kmh?: number | null;
      source?: string;
      recorded_at?: string;
      updated_at?: string;
      metadata?: Record<string, unknown>;
    }>(LINKS.partner.drivers.live(partnerId, driverId));

    const lat = raw.latitude ?? 5.3476;
    const lng = raw.longitude ?? -4.0107;
    const DELTA = 0.03;

    const driver: import("@/shared/types").LiveMapDriver = {
      id: raw.driver_id ?? String(driverId),
      name: "",
      vehicle: "",
      availability: "offline",
      lat,
      lng,
      heading: raw.heading ?? 0,
    };

    const bounds: import("@/shared/types").LiveMapData["bounds"] = {
      lat_min: lat - DELTA,
      lat_max: lat + DELTA,
      lng_min: lng - DELTA,
      lng_max: lng + DELTA,
    };

    return {
      driver,
      bounds,
      zone_name: "",
      city: "",
      updated_at: raw.updated_at ?? raw.recorded_at ?? new Date().toISOString(),
    } satisfies PartnerDriverLiveMap;
  },
};

export const partnerLiveMapService = {
  get: async (partnerId: string | number): Promise<LiveMapData> => {
    const response = await apiClient.get<ApiPartnerLiveMapResponse>(
      LINKS.partner.ops.map(partnerId)
    );
    return mapApiPartnerLiveMapToData(response, String(partnerId));
  },
};
