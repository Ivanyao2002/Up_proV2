import { apiClient } from "@/core/http/apiClient";

export interface TripForensicAnomaly {
  id: string;
  type: string;
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface TripForensicData {
  trip_id: string;
  ref: string;
  driver_name: string;
  recorded_at: string;
  distance_km: number;
  duration_min: number;
  anomalies: TripForensicAnomaly[];
  gps_trace: {
    at: string;
    lat: number;
    lng: number;
    speed_kmh: number;
  }[];
  from_coords: { lat: number; lng: number };
  to_coords: { lat: number; lng: number };
}

export interface CrisisModeState {
  active: boolean;
  level: "normal" | "elevated" | "critical";
  pause_dispatch: boolean;
  global_surge_multiplier: number;
  alert_title: string;
  alert_message: string;
  affected_zones: string[];
  updated_at: string;
  updated_by: string;
}

export const opsExtendedService = {
  getTripForensic: (tripId: string) =>
    apiClient.get<TripForensicData>(`/admin/ops/trips/${tripId}/forensic`),

  getCrisisMode: () => apiClient.get<CrisisModeState>("/admin/ops/crisis"),

  updateCrisisMode: (payload: Partial<CrisisModeState>) =>
    apiClient.put<CrisisModeState>("/admin/ops/crisis", payload),
};
