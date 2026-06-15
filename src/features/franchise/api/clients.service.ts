import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type {
  FleetClient,
  FleetClientDetail,
} from "@/features/fleet/api/clients.service";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

interface V1ClientsResponse {
  status?: string;
  items?: Record<string, any>[];
  pagination?: { total?: number; page?: number; per_page?: number; total_pages?: number };
}

interface V1ClientDetailResponse {
  status?: string;
  user?: Record<string, any>;
  profile?: Record<string, any>;
  recentOrders?: Record<string, any>[];
}

function mapUserStatus(s?: string | null): FleetClient["status"] {
  return String(s ?? "active").toLowerCase() === "suspended" ? "suspended" : "active";
}

function mapV1ClientItem(item: Record<string, any>): FleetClient {
  const firstName = item.first_name ?? item.firstName ?? "";
  const lastName = item.last_name ?? item.lastName ?? "";
  const fullName =
    item.display_name?.trim() ||
    item.fullName?.trim() ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    item.email ||
    `Client ${String(item.id).slice(0, 8)}`;
  const rawType = String(item.user_type ?? item.userType ?? "CLIENT").toUpperCase();
  return {
    id: item.id,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    phone: item.phone ?? "—",
    email: item.email ?? null,
    type: rawType === "B2B" ? "b2b" : "b2c",
    user_type: rawType,
    status: mapUserStatus(item.status),
    trips_count: item.trips_count ?? item.tripsCount ?? 0,
    wallet_balance_fcfa: item.wallet_balance_xof ?? item.walletBalanceXof ?? 0,
    registered_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    last_trip_at: item.last_trip_at ?? item.lastTripAt ?? null,
  };
}

function mapV1ClientDetail(res: V1ClientDetailResponse): FleetClientDetail {
  const u = res.user ?? {};
  const base = mapV1ClientItem(u);
  const profile = res.profile ?? {};

  const tripsTotal =
    u.trips_count ?? u.tripsCount ?? profile.orders_completed_count ?? base.trips_count;
  const wallet = u.wallet_balance_xof ?? u.walletBalanceXof ?? base.wallet_balance_fcfa;
  const totalSpent = profile.total_spent_xof ?? profile.total_spent_fcfa ?? 0;
  const cancelled = profile.cancelled_trips_count ?? profile.trips_cancelled ?? 0;

  const recent_trips = (res.recentOrders ?? []).map((o: Record<string, any>) => ({
    id: o.id ?? "",
    ref:
      o.orderReference?.trim() ||
      o.order_reference?.trim() ||
      (o.id ? `#${String(o.id).slice(0, 8).toUpperCase()}` : "—"),
    from_label: o.pickupAddress?.trim() || o.pickup_address?.trim() || "—",
    to_label: o.dropoffAddress?.trim() || o.dropoff_address?.trim() || "—",
    status: o.status ?? "completed",
    amount_fcfa: o.amountXof ?? o.amount_xof ?? o.final_price_xof ?? 0,
    created_at: o.createdAt ?? o.created_at ?? new Date().toISOString(),
  }));

  const pricedTrips = recent_trips.filter((t) => t.amount_fcfa > 0);
  const avgFare =
    pricedTrips.length > 0
      ? Math.round(pricedTrips.reduce((s, t) => s + t.amount_fcfa, 0) / pricedTrips.length)
      : 0;

  return {
    ...base,
    trips_count: tripsTotal,
    wallet_balance_fcfa: wallet,
    stats: {
      trips_total: tripsTotal,
      trips_cancelled: cancelled,
      wallet_balance_fcfa: wallet,
      total_spent_fcfa: totalSpent,
      avg_fare_fcfa: avgFare,
    },
    recent_trips,
  };
}

export const franchiseClientsService = {
  list: async (params?: ListParams): Promise<Paginated<FleetClient>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FleetClient>>(
        `/franchise/fleet/clients${buildListQuery(params)}`
      );
    }
    const res = await apiClient.get<V1ClientsResponse>(
      appendQuery(LINKS.franchise.v1.clients, buildV1ListQuery(params))
    );
    const items = (res.items ?? []).map(mapV1ClientItem);
    return {
      data: items,
      meta: {
        total: res.pagination?.total ?? items.length,
        current_page: res.pagination?.page ?? params?.page ?? 1,
        per_page: res.pagination?.per_page ?? params?.per_page ?? 20,
        last_page: res.pagination?.total_pages ?? 1,
      },
    };
  },

  get: async (id: string): Promise<FleetClientDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FleetClientDetail>(`/franchise/fleet/clients/${id}`);
    }
    try {
      const res = await apiClient.get<V1ClientDetailResponse>(
        `${LINKS.franchise.v1.clients}/${id}`
      );
      const errorCode = (res as any)?.error?.code ?? (res as any)?.code;
      if (errorCode === "ADMIN_REQUIRED") throw new Error("ADMIN_REQUIRED");
      return mapV1ClientDetail(res);
    } catch (err: any) {
      const isAdminRequired =
        err?.code === "ADMIN_REQUIRED" ||
        err?.message === "ADMIN_REQUIRED" ||
        err?.status === 403;
      if (isAdminRequired) {
        return apiClient.get<FleetClientDetail>(`/franchise/fleet/clients/${id}`);
      }
      throw err;
    }
  },

  suspend: (id: string) =>
    useLegacyPortalApi()
      ? apiClient.post<{ ok: boolean; message: string }>(`/franchise/fleet/clients/${id}/suspend`)
      : apiClient.post<{ ok: boolean; message: string }>(`${LINKS.franchise.v1.clients}/${id}/suspend`),

  activate: (id: string) =>
    useLegacyPortalApi()
      ? apiClient.post<{ ok: boolean; message: string }>(`/franchise/fleet/clients/${id}/activate`)
      : apiClient.post<{ ok: boolean; message: string }>(`${LINKS.franchise.v1.clients}/${id}/activate`),
};
