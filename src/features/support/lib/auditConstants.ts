import type {
  SupportAuditAction,
  SupportAuditCategory,
  SupportAuditEvent,
  SupportAuditSeverity,
} from "../api/supportAudit.types";

export const SEVERITY_DOT: Record<SupportAuditSeverity, string> = {
  info    : "bg-blue-400",
  warning : "bg-amber-400",
  critical: "bg-red-500",
};

export const SEVERITY_CONFIG: Record<SupportAuditSeverity, { label: string; className: string }> = {
  info: {
    label: "Info",
    className: "text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  },
  warning: {
    label: "Avertissement",
    className: "text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  },
  critical: {
    label: "Critique",
    className: "text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40",
  },
};

export const ACTION_LABELS: Record<SupportAuditAction, string> = {
  "ticket.assigned":                "Prise en charge",
  "ticket.message_sent":            "Réponse envoyée",
  "ticket.note_added":              "Note interne",
  "ticket.justification_requested": "Justificatif demandé",
  "ticket.resolved":                "Réclamation résolue",
  "ticket.closed":                  "Réclamation clôturée",
  "ticket.escalated":               "Réclamation escaladée",
  "sanction.applied":               "Sanction appliquée",
  "compensation.applied":           "Geste commercial",
  "chat.message_sent":              "Message de chat",
  "auth.login":                     "Connexion",
  "auth.logout":                    "Déconnexion",
};

export const SANCTION_LABELS = {
  warning:        "Avertissement",
  surveillance:   "Mise sous surveillance",
  quality_points: "Retrait de points qualité",
  suspension:     "Suspension temporaire",
} as const;

export const COMPENSATION_LABELS = {
  percentage_discount: "Réduction en pourcentage",
  fixed_discount:      "Réduction fixe",
  free_service:        "Service offert",
} as const;

export const SEVERITY_FILTERS = [
  { value: "all" as const,      label: "Tous niveaux" },
  { value: "info" as const,     label: "Info" },
  { value: "warning" as const,  label: "Avertissement" },
  { value: "critical" as const, label: "Critique" },
];

export const CATEGORY_FILTERS: { value: SupportAuditCategory | "all"; label: string }[] = [
  { value: "all",          label: "Toutes catégories" },
  { value: "ticket",       label: "Réclamations" },
  { value: "compensation", label: "Gestes commerciaux" },
  { value: "sanction",     label: "Sanctions" },
  { value: "escalation",   label: "Escalades" },
  { value: "chat",         label: "Messages chat" },
  { value: "auth",         label: "Connexions" },
];

export const ACTION_FILTERS: { value: SupportAuditAction | "all"; label: string }[] = [
  { value: "all",                               label: "Toutes les actions" },
  { value: "ticket.assigned",                   label: "Prises en charge" },
  { value: "ticket.message_sent",               label: "Réponses" },
  { value: "ticket.note_added",                 label: "Notes internes" },
  { value: "ticket.justification_requested",    label: "Justificatifs" },
  { value: "sanction.applied",                  label: "Sanctions" },
  { value: "compensation.applied",              label: "Gestes commerciaux" },
  { value: "ticket.resolved",                   label: "Résolutions" },
  { value: "ticket.closed",                     label: "Clôtures" },
  { value: "ticket.escalated",                  label: "Escalades" },
];

export const DATE_PRESETS = [
  { value: "all",   label: "Toute la période" },
  { value: "today", label: "Aujourd'hui" },
  { value: "7d",    label: "7 derniers jours" },
  { value: "30d",   label: "30 derniers jours" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

export function getDateFrom(preset: DatePreset): string | undefined {
  const now = new Date();
  if (preset === "today") return now.toISOString().split("T")[0];
  if (preset === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }
  if (preset === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }
  return undefined;
}

export const CATEGORY_LABELS: Record<SupportAuditEvent["category"], string> = {
  ticket:       "Réclamation",
  compensation: "Geste commercial",
  sanction:     "Sanction",
  escalation:   "Escalade",
  chat:         "Chat",
  auth:         "Authentification",
};

export const META_LABELS: Record<string, string> = {
  sanction_type:     "Type de sanction",
  compensation_type: "Type de compensation",
  discount_value:    "Valeur",
  promo_code:        "Code promo",
  message_type:      "Type de message",
  transition_note:   "Note de transition",
};

export function getActionSubtype(event: SupportAuditEvent): string | null {
  const metadata = event.metadata;
  if (metadata?.sanction_type) return SANCTION_LABELS[metadata.sanction_type];
  if (metadata?.compensation_type) {
    const value =
      metadata.discount_value != null
        ? ` · ${metadata.discount_value}${
            metadata.compensation_type === "percentage_discount" ? "%" : " FCFA"
          }`
        : "";
    return `${COMPENSATION_LABELS[metadata.compensation_type]}${value}`;
  }
  return null;
}
