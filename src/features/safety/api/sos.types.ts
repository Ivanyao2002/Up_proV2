export type SosIncidentStatus =
  | "active"
  | "acknowledged"
  | "escalated"
  | "resolved"
  | "cancelled";

export type SosSeverity = "low" | "medium" | "high" | "critical";

export type SosResolution =
  | "client_safe"
  | "false_alarm"
  | "emergency_services_contacted"
  | "resolved_by_support"
  | "other"
  | string;

export interface SosAttentionFlags {
  gpsLost: boolean;
  highRisk: boolean;
  escalated: boolean;
}

export interface SosIncident {
  id: string;
  status: SosIncidentStatus;
  severity: SosSeverity;
  actor_type: string;
  incident_type: string;
  trigger: string;
  risk_score: number;
  risk_factors: string[];
  escalation_level: number;
  silent_mode: boolean;
  latitude: number;
  longitude: number;
  last_latitude: number | null;
  last_longitude: number | null;
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  cancelled_at: string | null;
  client_id: string | null;
  driver_id: string | null;
  order_id: string | null;
  franchise_id: string | null;
  partner_id: string | null;
  age_minutes: number | null;
  last_location_age_minutes: number | null;
  tracking_url: string | null;
  attention_flags: SosAttentionFlags | null;
  message: string | null;
  device_platform: string | null;
  battery_level: number | null;
  network_type: string | null;
  share_expires_at: string | null;
}

export interface SosDashboardStats {
  active: number;
  acknowledged: number;
  escalated: number;
  critical: number;
  highRisk: number;
  gpsLost: number;
}

export interface SosDashboard {
  stats: SosDashboardStats;
  active_incidents: SosIncident[];
  generated_at: string;
}

export interface SosLocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  speed_kmh: number | null;
  battery_level: number | null;
  network_type: string | null;
  recorded_at: string;
}

export interface SosTimelineEvent {
  id: string;
  event_type: string;
  label: string;
  description: string | null;
  old_status: string | null;
  new_status: string | null;
  new_status_label: string | null;
  escalation_level: number | null;
  at: string;
  actor_user_id: string | null;
}

export interface SosIncidentDetail {
  incident: SosIncident;
  locations: SosLocationPoint[];
  events: SosTimelineEvent[];
  generated_at: string;
}

export interface SosListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  severity?: string;
}

export interface AcknowledgeSosPayload {
  notes?: string;
}

export interface ResolveSosPayload {
  resolution: SosResolution;
  notes?: string;
}
