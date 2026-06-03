import { apiClient } from "@/core/http/apiClient";
import type { Paginated, TripStatus } from "@/shared/types";

export interface FleetClient {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  type: "b2c" | "b2b";
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
  list: () => apiClient.get<Paginated<FleetClient>>("/admin/fleet/clients"),
  get: (id: string) => apiClient.get<FleetClientDetail>(`/admin/fleet/clients/${id}`),
  suspend: (id: string) =>
    apiClient.post<{ ok: boolean; message: string }>(`/admin/fleet/clients/${id}/suspend`),
  activate: (id: string) =>
    apiClient.post<{ ok: boolean; message: string }>(`/admin/fleet/clients/${id}/activate`),
};
