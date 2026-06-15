import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated, TripStatus } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiAdminUserDetailResponse,
  ApiAdminUsersResponse,
} from "./adminUsers.api.types";
import {
  mapAdminUserDetailToFleetClientDetail,
  mapAdminUsersToPaginated,
} from "./adminUsers.mapper";

export interface FleetClient {
  id: string | number;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  type: "b2c" | "b2b";
  user_type: string;
  status: "active" | "suspended";
  trips_count: number;
  wallet_balance_fcfa: number;
  registered_at: string;
  last_trip_at: string | null;
}

export interface FleetClientDetail extends FleetClient {
  stats: {
    trips_total: number;
    trips_cancelled: number;
    wallet_balance_fcfa: number;
    total_spent_fcfa: number;
    avg_fare_fcfa: number;
  };
  recent_trips: {
    id: string;
    ref: string;
    from_label: string;
    to_label: string;
    status: TripStatus;
    amount_fcfa: number;
    created_at: string;
  }[];
  notes?: string;
}

export const clientsService = {
  list: async (params?: ListParams): Promise<Paginated<FleetClient>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<FleetClient>>(
        `/admin/fleet/clients${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiAdminUsersResponse>(
      `${LINKS.admin.v1.users}${buildV1ListQuery(params)}`
    );
    const users = response.users ?? response.items ?? [];
    return mapAdminUsersToPaginated(users, params, response.pagination);
  },
  get: async (id: string): Promise<FleetClientDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<FleetClientDetail>(`/admin/fleet/clients/${id}`);
    }
    const response = await apiClient.get<ApiAdminUserDetailResponse>(
      LINKS.admin.v1.userById(id)
    );
    return mapAdminUserDetailToFleetClientDetail(response);
  },
  suspend: (id: string) =>
    useLegacyAdminApi()
      ? apiClient.post<{ ok: boolean; message: string }>(
          `/admin/fleet/clients/${id}/suspend`
        )
      : apiClient.post<{ ok: boolean; message: string }>(
          LINKS.admin.v1.userSuspend(id)
        ),
  activate: (id: string) =>
    useLegacyAdminApi()
      ? apiClient.post<{ ok: boolean; message: string }>(
          `/admin/fleet/clients/${id}/activate`
        )
      : apiClient.post<{ ok: boolean; message: string }>(
          LINKS.admin.v1.userActivate(id)
        ),
};
