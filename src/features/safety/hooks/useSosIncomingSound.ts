"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  SOS_ACTOR_LABELS,
  SOS_SEVERITY_LABELS,
  SOS_TRIGGER_LABELS,
} from "../lib/sosLabels";
import {
  SOS_INCOMING_SOUND_POLL_MS,
  SOS_NOTIFY_DEBOUNCE_MS,
} from "../api/sos.realtime";
import type { SosDashboard, SosIncident } from "../api/sos.types";
import {
  playSosNotificationSound,
  unlockSosAudioOnInteraction,
} from "@/shared/lib/sosNotificationSound";

interface IncidentTrack {
  escalation_level: number;
  severity: SosIncident["severity"];
}

interface UseSosIncomingSoundOptions {
  dashboardQueryKey: readonly unknown[];
  dashboardQueryFn: () => Promise<SosDashboard>;
  enabled?: boolean;
  pollIntervalMs?: number;
}

function formatSosAlertLabel(incident: SosIncident, escalated: boolean): string {
  const actor = SOS_ACTOR_LABELS[incident.actor_type] ?? incident.actor_type;
  const trigger = SOS_TRIGGER_LABELS[incident.trigger] ?? incident.trigger;
  const severity = SOS_SEVERITY_LABELS[incident.severity] ?? incident.severity;
  const prefix = escalated ? "Escalade SOS" : "Nouvelle alerte SOS";
  return `${prefix} — ${actor} · ${trigger} (${severity})`;
}

function isUrgentIncident(incident: SosIncident): boolean {
  return (
    incident.severity === "critical" ||
    incident.severity === "high" ||
    incident.escalation_level >= 2 ||
    incident.status === "escalated"
  );
}

export function useSosIncomingSound({
  dashboardQueryKey,
  dashboardQueryFn,
  enabled = true,
  pollIntervalMs = SOS_INCOMING_SOUND_POLL_MS,
}: UseSosIncomingSoundOptions) {
  const readyRef = useRef(false);
  const trackedRef = useRef<Map<string, IncidentTrack>>(new Map());
  const lastNotifyAtRef = useRef(0);

  useEffect(() => {
    unlockSosAudioOnInteraction();
  }, []);

  const notifySos = (label: string, urgent: boolean) => {
    const now = Date.now();
    if (now - lastNotifyAtRef.current < SOS_NOTIFY_DEBOUNCE_MS) return;
    lastNotifyAtRef.current = now;
    playSosNotificationSound(urgent);
    notificationService.warning(label, { duration: 6000 });
  };

  // Clé dédiée au polling sonore (#34 audit UX) : on n'hérite pas du cache du
  // dashboard, qui poll à un intervalle différent — sinon double charge non
  // déterministe (les deux requêtes se disputent le même cache).
  const soundQueryKey = [...dashboardQueryKey, "sound"] as const;

  const { data } = useQuery({
    queryKey: soundQueryKey,
    queryFn: dashboardQueryFn,
    enabled,
    refetchInterval: pollIntervalMs,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const incidents = data?.active_incidents ?? [];
    const next = new Map<string, IncidentTrack>();

    for (const incident of incidents) {
      next.set(incident.id, {
        escalation_level: incident.escalation_level,
        severity: incident.severity,
      });
    }

    if (!readyRef.current) {
      trackedRef.current = next;
      readyRef.current = true;
      return;
    }

    const previous = trackedRef.current;

    for (const incident of incidents) {
      const prev = previous.get(incident.id);
      if (!prev) {
        notifySos(formatSosAlertLabel(incident, false), isUrgentIncident(incident));
        continue;
      }
      if (incident.escalation_level > prev.escalation_level) {
        notifySos(formatSosAlertLabel(incident, true), true);
      }
    }

    trackedRef.current = next;
  }, [data]);
}
