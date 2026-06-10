import { http, HttpResponse } from "msw";
import sosSeed from "../data/sos-incidents.json";
import type { SosIncidentDetail } from "@/features/safety/api/sos.types";

interface MockIncident {
  id: string;
  status: string;
  severity: string;
  actor_type: string;
  incident_type: string;
  trigger: string;
  risk_score: number;
  risk_factors: string[];
  escalation_level: number;
  silent_mode: boolean;
  latitude: number;
  longitude: number;
  triggered_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  cancelled_at?: string | null;
  client_id?: string | null;
  driver_id?: string | null;
  order_id?: string | null;
  franchise_id?: string | null;
  partner_id?: string | null;
  ageMinutes?: number;
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
}

let incidents: MockIncident[] = [...sosSeed.incidents] as MockIncident[];

function toDetail(incident: MockIncident): SosIncidentDetail {
  return {
    incident: {
      id: incident.id,
      status: incident.status as SosIncidentDetail["incident"]["status"],
      severity: incident.severity as SosIncidentDetail["incident"]["severity"],
      actor_type: incident.actor_type,
      incident_type: incident.incident_type,
      trigger: incident.trigger,
      risk_score: incident.risk_score,
      risk_factors: incident.risk_factors,
      escalation_level: incident.escalation_level,
      silent_mode: incident.silent_mode,
      latitude: incident.latitude,
      longitude: incident.longitude,
      last_latitude: incident.latitude,
      last_longitude: incident.longitude,
      triggered_at: incident.triggered_at,
      acknowledged_at: incident.acknowledged_at ?? null,
      resolved_at: incident.resolved_at ?? null,
      cancelled_at: incident.cancelled_at ?? null,
      client_id: incident.client_id ?? null,
      driver_id: incident.driver_id ?? null,
      order_id: incident.order_id ?? null,
      franchise_id: incident.franchise_id ?? null,
      partner_id: incident.partner_id ?? null,
      age_minutes: incident.ageMinutes ?? null,
      last_location_age_minutes: null,
      tracking_url: null,
      attention_flags: null,
      message: incident.metadata?.request?.message ?? null,
      device_platform: incident.metadata?.request?.device?.platform ?? null,
      battery_level: incident.metadata?.request?.device?.batteryLevel ?? null,
      network_type: incident.metadata?.request?.device?.networkType ?? null,
      share_expires_at: null,
    },
    locations: [
      {
        id: `${incident.id}-loc-1`,
        latitude: incident.latitude,
        longitude: incident.longitude,
        accuracy_meters: 10,
        speed_kmh: 0,
        battery_level: incident.metadata?.request?.device?.batteryLevel ?? null,
        network_type: incident.metadata?.request?.device?.networkType ?? null,
        recorded_at: incident.triggered_at,
      },
    ],
    events: [
      {
        id: `${incident.id}-evt-1`,
        event_type: "sos.created",
        label: "Alerte déclenchée",
        description: incident.metadata?.request?.message ?? null,
        old_status: null,
        new_status: "active",
        new_status_label: "Actif",
        escalation_level: incident.escalation_level,
        at: incident.triggered_at,
        actor_user_id: null,
      },
    ],
    generated_at: new Date().toISOString(),
  };
}

export const safetyHandlers = [
  http.get("*/api/v2/admin/ops/sos/dashboard", () => {
    const active = incidents.filter(
      (i) => i.status === "active" || i.status === "escalated"
    );
    return HttpResponse.json({
      stats: sosSeed.stats,
      active_incidents: active.map((i) => toDetail(i).incident),
      generated_at: new Date().toISOString(),
    });
  }),

  http.get("*/api/v2/admin/ops/sos/incidents", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    let rows = [...incidents];
    if (status) rows = rows.filter((i) => i.status === status);
    if (severity) rows = rows.filter((i) => i.severity === severity);
    return HttpResponse.json({
      data: rows.map((i) => toDetail(i).incident),
      meta: {
        total: rows.length,
        per_page: 25,
        current_page: 1,
        last_page: 1,
      },
    });
  }),

  http.get("*/api/v2/admin/ops/sos/incidents/:id", ({ params }) => {
    const incident = incidents.find((i) => i.id === params.id);
    if (!incident) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(toDetail(incident));
  }),

  http.post("*/api/v2/admin/ops/sos/incidents/:id/acknowledge", ({ params }) => {
    const idx = incidents.findIndex((i) => i.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    incidents[idx] = {
      ...incidents[idx]!,
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
    };
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v2/admin/ops/sos/incidents/:id/resolve", ({ params }) => {
    const idx = incidents.findIndex((i) => i.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    incidents[idx] = {
      ...incidents[idx]!,
      status: "resolved",
      resolved_at: new Date().toISOString(),
    };
    return HttpResponse.json({ ok: true });
  }),
];
