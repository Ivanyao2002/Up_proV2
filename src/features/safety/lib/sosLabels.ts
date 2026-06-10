import type { SosIncidentStatus, SosResolution, SosSeverity } from "../api/sos.types";

export const SOS_STATUS_LABELS: Record<SosIncidentStatus, string> = {
  active: "Actif",
  acknowledged: "Pris en charge",
  escalated: "Escaladé",
  resolved: "Résolu",
  cancelled: "Annulé",
};

export const SOS_SEVERITY_LABELS: Record<SosSeverity, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  critical: "Critique",
};

export const SOS_TRIGGER_LABELS: Record<string, string> = {
  manual_button: "Bouton SOS",
  shake: "Secousse",
  voice: "Commande vocale",
  auto_escalation: "Escalade auto",
};

export const SOS_ACTOR_LABELS: Record<string, string> = {
  CLIENT: "Client",
  DRIVER: "Chauffeur",
  PASSENGER: "Passager",
};

export const SOS_RESOLUTION_OPTIONS: { value: SosResolution; label: string }[] = [
  { value: "client_safe", label: "Client en sécurité" },
  { value: "false_alarm", label: "Fausse alerte" },
  { value: "emergency_services_contacted", label: "Secours contactés" },
  { value: "resolved_by_support", label: "Résolu par le support" },
  { value: "other", label: "Autre" },
];

export const RISK_FACTOR_LABELS: Record<string, string> = {
  no_order_context: "Hors course",
  critical_severity: "Sévérité critique",
  silent_mode: "Mode silencieux",
  night_time: "Heure nocturne",
  gps_signal_lost: "Signal GPS perdu",
  high_risk_score: "Score de risque élevé",
};

/** Libellés timeline — `GET /v1/admin/safety/sos/{id}` → `events[]` */
export const SOS_EVENT_LABELS: Record<string, string> = {
  "sos.created": "Alerte déclenchée",
  "sos.acknowledged": "Prise en charge",
  "sos.escalated": "Escalade",
  "sos.resolved": "Incident clôturé",
  "sos.cancelled": "Alerte annulée",
  "sos.location_updated": "Position mise à jour",
  "sos.notifications_queued": "Notifications mises en file",
  "sos.detected.gps_signal_lost": "Signal GPS perdu détecté",
  "sos.safety_check_failed": "Contrôle sécurité échoué",
  "sos.safety_check_ok": "Contrôle sécurité OK",
};

const SOS_SCAN_REASON_LABELS: Record<string, string> = {
  periodic_safety_scan: "Scan sécurité périodique",
};

export function formatRiskFactor(key: string): string {
  return RISK_FACTOR_LABELS[key] ?? key.replaceAll("_", " ");
}

export function getSosStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  const key = status.toLowerCase() as SosIncidentStatus;
  return SOS_STATUS_LABELS[key] ?? status;
}

export function getSosEventLabel(eventType: string): string {
  if (SOS_EVENT_LABELS[eventType]) return SOS_EVENT_LABELS[eventType]!;

  if (eventType.startsWith("sos.detected.")) {
    const factor = eventType.slice("sos.detected.".length);
    const factorLabel = formatRiskFactor(factor);
    return factorLabel !== factor
      ? `${factorLabel} détecté`
      : `Détection : ${factor.replaceAll("_", " ")}`;
  }

  return eventType.replaceAll("_", " ").replaceAll(".", " · ");
}

export function formatSosScanReason(reason: string): string {
  return SOS_SCAN_REASON_LABELS[reason] ?? reason.replaceAll("_", " ");
}
