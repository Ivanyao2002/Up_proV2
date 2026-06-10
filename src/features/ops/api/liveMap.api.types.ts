/** GET /v1/admin/live-map — Swagger § 10 - Admin */

import type { LiveMapRealtimeConfig } from "@/shared/types";

export interface ApiLiveMapMeta {
  generatedAt?: string;
  onlineInDatabase?: number;
  withRecentLocation?: number;
  maxLocationAgeSeconds?: number;
  locationCacheTtlSeconds?: number;
  includeWithoutLocation?: boolean;
  realtime?: LiveMapRealtimeConfig;
}

export interface ApiLiveMapDriverProfile {
  id?: string;
  displayName?: string;
  phone?: string;
  email?: string;
}

export interface ApiLiveMapDriverLocation {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  heading?: number | null;
  speedKmh?: number | null;
  recordedAt?: string;
  ageSeconds?: number;
  updatedAt?: string;
}

export interface ApiLiveMapDriver {
  id: string;
  userId?: string;
  driverCode?: string;
  partnerId?: string | null;
  franchiseId?: string | null;
  cityId?: string | null;
  availabilityStatus?: string;
  approvalStatus?: string;
  rideCategoryCode?: string;
  profile?: ApiLiveMapDriverProfile;
  partnerName?: string;
  franchiseName?: string;
  zoneName?: string;
  vehicleLabel?: string;
  vehicleColor?: string | null;
  vehicleColorCode?: string | null;
  vehicle_color?: string | null;
  vehicle_color_code?: string | null;
  vehicle?: {
    id?: string | null;
    color?:
      | string
      | {
          id?: string | null;
          code?: string | null;
          label?: string | null;
          hex?: string | null;
        }
      | null;
    colorCode?: string | null;
    color_code?: string | null;
    colorLabel?: string | null;
    color_label?: string | null;
    colorId?: string | null;
    color_id?: string | null;
    label?: string | null;
    plateNumber?: string | null;
    plate_number?: string | null;
  } | null;
  ratingAvg?: number | null;
  location?: ApiLiveMapDriverLocation | null;
  isTracked?: boolean;
}

export interface ApiLiveMapOrderParty {
  id?: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ApiLiveMapOrderBase {
  id: string;
  order_reference?: string | null;
  client_id?: string | null;
  client?: ApiLiveMapOrderParty | null;
  driver?: ApiLiveMapOrderParty | null;
  partnerName?: string | null;
  franchiseName?: string | null;
  franchise_id?: string | null;
  partner_id?: string | null;
  partner?: ApiLiveMapOrderParty & {
    tradeName?: string | null;
    trade_name?: string | null;
  } | null;
  franchise?: { id?: string; name?: string | null } | null;
  status?: string;
  service_type?: string;
  pickup_address?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  dropoff_address?: string | null;
  dropoff_latitude?: number | null;
  dropoff_longitude?: number | null;
  driver_id?: string | null;
  estimated_price_xof?: number | null;
  final_price_xof?: number | null;
  driver_gain_xof?: number | null;
  created_at?: string;
  updated_at?: string;
  accepted_at?: string | null;
  arrived_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  payment_method_code?: string | null;
  metadata?: {
    dispatch?: {
      status?: string;
      offers?: {
        driverId?: string;
        userId?: string;
        status?: string;
        ratingAvg?: number;
      }[];
    };
    [key: string]: unknown;
  };
}

/** Agrégats réseau renvoyés par GET /v1/admin/live-map */
export interface ApiLiveMapStats {
  online?: number;
  onTrip?: number;
  activeTrips?: number;
  avgWaitMin?: number;
  on_trip?: number;
  active_trips?: number;
  avg_wait_min?: number;
  drivers_online?: number;
  drivers_on_trip?: number;
}

export interface ApiAdminLiveMapResponse {
  status: string;
  generatedAt?: string;
  drivers?: ApiLiveMapDriver[];
  meta?: ApiLiveMapMeta;
  stats?: ApiLiveMapStats;
  orders?: {
    rides?: ApiLiveMapOrderBase[];
    deliveries?: ApiLiveMapOrderBase[];
  };
  filters?: {
    applied?: {
      franchiseId?: string | null;
      partnerId?: string | null;
      cityId?: string | null;
    };
  };
}
