import type { ApiV1Pagination } from "@/core/api/v1Pagination";

export interface ApiSosIncidentRaw {
  id: string;
  status?: string;
  severity?: string;
  actor_type?: string;
  incident_type?: string;
  trigger?: string;
  risk_score?: number;
  risk_factors?: string[];
  escalation_level?: number;
  silent_mode?: boolean;
  latitude?: number;
  longitude?: number;
  location?: { coordinates?: [number, number] };
  last_latitude?: number | null;
  last_longitude?: number | null;
  triggered_at?: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  cancelled_at?: string | null;
  client_id?: string | null;
  driver_id?: string | null;
  order_id?: string | null;
  franchise_id?: string | null;
  partner_id?: string | null;
  ageMinutes?: number;
  lastLocationAgeMinutes?: number;
  trackingUrl?: string;
  attentionFlags?: {
    gpsLost?: boolean;
    highRisk?: boolean;
    escalated?: boolean;
  };
  metadata?: {
    request?: {
      message?: string;
      device?: {
        platform?: string;
        batteryLevel?: number;
        networkType?: string;
      };
    };
  };
  share_expires_at?: string | null;
}

export interface ApiSosListResponse {
  status?: string;
  generatedAt?: string;
  incidents?: ApiSosIncidentRaw[];
  pagination?: ApiV1Pagination;
}

export interface ApiSosDashboardResponse {
  status?: string;
  generatedAt?: string;
  dashboard?: {
    stats?: {
      active?: number;
      acknowledged?: number;
      escalated?: number;
      critical?: number;
      highRisk?: number;
      gpsLost?: number;
    };
    activeIncidents?: ApiSosIncidentRaw[];
  };
}

export interface ApiSosLocationRaw {
  id: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number | null;
  speed_kmh?: number | null;
  battery_level?: number | null;
  network_type?: string | null;
  recorded_at?: string;
}

export interface ApiSosEventRaw {
  id: string;
  event_type?: string;
  old_status?: string | null;
  new_status?: string | null;
  escalation_level?: number | null;
  payload?: Record<string, unknown>;
  created_at?: string;
  actor_user_id?: string | null;
}

export interface ApiSosDetailResponse {
  status?: string;
  generatedAt?: string;
  incident?: ApiSosIncidentRaw;
  locations?: ApiSosLocationRaw[];
  events?: ApiSosEventRaw[];
}
