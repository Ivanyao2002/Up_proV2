import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import { paginateClientList } from "@/shared/lib/clientList";
import type {
  ApiSosDashboardResponse,
  ApiSosDetailResponse,
  ApiSosEventRaw,
  ApiSosIncidentRaw,
  ApiSosListResponse,
  ApiSosLocationRaw,
} from "./adminSos.api.types";
import {
  formatSosScanReason,
  getSosEventLabel,
  getSosStatusLabel,
} from "../lib/sosLabels";
import type {
  SosDashboard,
  SosIncident,
  SosIncidentDetail,
  SosIncidentStatus,
  SosListParams,
  SosLocationPoint,
  SosSeverity,
  SosTimelineEvent,
} from "./sos.types";

function readCoords(item: ApiSosIncidentRaw): { lat: number; lng: number } {
  const coords = item.location as
    | { coordinates?: [number, number] }
    | undefined;
  const lng = item.longitude ?? coords?.coordinates?.[0] ?? 0;
  const lat = item.latitude ?? coords?.coordinates?.[1] ?? 0;
  return { lat, lng };
}

function mapStatus(value?: string | null): SosIncidentStatus {
  const key = String(value ?? "active").toLowerCase();
  if (key === "acknowledged") return "acknowledged";
  if (key === "escalated") return "escalated";
  if (key === "resolved") return "resolved";
  if (key === "cancelled") return "cancelled";
  return "active";
}

function mapSeverity(value?: string | null): SosSeverity {
  const key = String(value ?? "medium").toLowerCase();
  if (key === "low") return "low";
  if (key === "high") return "high";
  if (key === "critical") return "critical";
  return "medium";
}

function mapIncidentItem(item: ApiSosIncidentRaw): SosIncident {
  const { lat, lng } = readCoords(item);
  const lastLat = item.last_latitude ?? lat;
  const lastLng = item.last_longitude ?? lng;
  const device = item.metadata?.request?.device;

  return {
    id: item.id,
    status: mapStatus(item.status),
    severity: mapSeverity(item.severity),
    actor_type: item.actor_type ?? "—",
    incident_type: item.incident_type ?? "emergency",
    trigger: item.trigger ?? "manual_button",
    risk_score: item.risk_score ?? 0,
    risk_factors: item.risk_factors ?? [],
    escalation_level: item.escalation_level ?? 0,
    silent_mode: Boolean(item.silent_mode),
    latitude: lat,
    longitude: lng,
    last_latitude: item.last_latitude ?? lastLat,
    last_longitude: item.last_longitude ?? lastLng,
    triggered_at: item.triggered_at ?? new Date().toISOString(),
    acknowledged_at: item.acknowledged_at ?? null,
    resolved_at: item.resolved_at ?? null,
    cancelled_at: item.cancelled_at ?? null,
    client_id: item.client_id ?? null,
    driver_id: item.driver_id ?? null,
    order_id: item.order_id ?? null,
    franchise_id: item.franchise_id ?? null,
    partner_id: item.partner_id ?? null,
    age_minutes: item.ageMinutes ?? null,
    last_location_age_minutes: item.lastLocationAgeMinutes ?? null,
    tracking_url: item.trackingUrl ?? null,
    attention_flags: item.attentionFlags
      ? {
          gpsLost: Boolean(item.attentionFlags.gpsLost),
          highRisk: Boolean(item.attentionFlags.highRisk),
          escalated: Boolean(item.attentionFlags.escalated),
        }
      : null,
    message: item.metadata?.request?.message ?? null,
    device_platform: device?.platform ?? null,
    battery_level: device?.batteryLevel ?? null,
    network_type: device?.networkType ?? null,
    share_expires_at: item.share_expires_at ?? null,
  };
}

function readPayloadString(
  payload: Record<string, unknown>,
  key: string
): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapEventDescription(
  event: ApiSosEventRaw,
  payload: Record<string, unknown>
): string | null {
  const type = event.event_type ?? "";

  if (type === "sos.notifications_queued") {
    const targets: string[] = [];
    if (payload.centralAdmin === true) targets.push("Admin central");
    if (payload.franchise === true) targets.push("Franchise");
    if (payload.partner === true) targets.push("Partenaire");
    const trusted =
      typeof payload.trustedContacts === "number"
        ? payload.trustedContacts
        : null;
    const parts = [
      targets.length ? targets.join(", ") : null,
      trusted != null ? `Contacts de confiance : ${trusted}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }

  if (type === "sos.detected.gps_signal_lost") {
    const reason = readPayloadString(payload, "reason");
    const diagnostics = payload.diagnostics as
      | { gpsLostSeconds?: number }
      | undefined;
    const lostSeconds = diagnostics?.gpsLostSeconds;
    const parts = [
      reason ? formatSosScanReason(reason) : null,
      lostSeconds != null ? `GPS perdu depuis ${lostSeconds} s` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }

  return (
    readPayloadString(payload, "message") ?? readPayloadString(payload, "notes")
  );
}

function mapLocation(item: ApiSosLocationRaw): SosLocationPoint {
  return {
    id: item.id,
    latitude: item.latitude ?? 0,
    longitude: item.longitude ?? 0,
    accuracy_meters: item.accuracy_meters ?? null,
    speed_kmh: item.speed_kmh ?? null,
    battery_level: item.battery_level ?? null,
    network_type: item.network_type ?? null,
    recorded_at: item.recorded_at ?? new Date().toISOString(),
  };
}

function mapEvent(item: ApiSosEventRaw): SosTimelineEvent {
  const payload = item.payload ?? {};
  const eventType = item.event_type ?? "event";

  return {
    id: item.id,
    event_type: eventType,
    label: getSosEventLabel(eventType),
    description: mapEventDescription(item, payload),
    old_status: item.old_status ?? null,
    new_status: item.new_status ?? null,
    new_status_label: getSosStatusLabel(item.new_status) || null,
    escalation_level: item.escalation_level ?? null,
    at: item.created_at ?? new Date().toISOString(),
    actor_user_id: item.actor_user_id ?? null,
  };
}

export function mapSosIncidentsList(
  response: ApiSosListResponse,
  params?: SosListParams
): Paginated<SosIncident> {
  const mapped = (response.incidents ?? []).map(mapIncidentItem);
  if (response.pagination && Object.keys(response.pagination).length > 0) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}

export function mapSosDashboard(response: ApiSosDashboardResponse): SosDashboard {
  const dash = response.dashboard;
  return {
    stats: {
      active: dash?.stats?.active ?? 0,
      acknowledged: dash?.stats?.acknowledged ?? 0,
      escalated: dash?.stats?.escalated ?? 0,
      critical: dash?.stats?.critical ?? 0,
      highRisk: dash?.stats?.highRisk ?? 0,
      gpsLost: dash?.stats?.gpsLost ?? 0,
    },
    active_incidents: (dash?.activeIncidents ?? []).map(mapIncidentItem),
    generated_at: response.generatedAt ?? new Date().toISOString(),
  };
}

export function mapSosIncidentDetail(
  response: ApiSosDetailResponse
): SosIncidentDetail {
  if (!response.incident?.id) {
    throw new Error("SOS_INCIDENT_NOT_FOUND");
  }

  return {
    incident: mapIncidentItem(response.incident),
    locations: (response.locations ?? []).map(mapLocation),
    events: (response.events ?? [])
      .map(mapEvent)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    generated_at: response.generatedAt ?? new Date().toISOString(),
  };
}
