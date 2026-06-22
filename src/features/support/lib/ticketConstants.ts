import type { AdminSupportTicket } from "../api/tickets.service";
import type { AgentReporterType, AgentTicketCategory } from "../api/agentTicket.types";

export const TERMINAL_STATUSES = new Set(["resolved", "closed", "escalated"]);

export const STATUS_FILTERS: { value: AdminSupportTicket["status"] | "all"; label: string }[] = [
  { value: "all",         label: "Tous" },
  { value: "open",        label: "Non assignés" },
  { value: "in_progress", label: "En cours" },
  { value: "escalated",   label: "Escaladés" },
  { value: "resolved",    label: "Résolus" },
  { value: "closed",      label: "Clôturés" },
];

export const STATUS_LABELS: Record<AdminSupportTicket["status"], string> = {
  open:        "Non assigné",
  in_progress: "En cours",
  resolved:    "Résolu",
  closed:      "Clôturé",
  escalated:   "Escaladé",
};

export const REPORTER_FILTERS: { value: AgentReporterType | "all"; label: string }[] = [
  { value: "all",       label: "Tous" },
  { value: "client",    label: "Client" },
  { value: "driver",    label: "Chauffeur" },
  { value: "deliverer", label: "Livreur" },
  { value: "partner",   label: "Partenaire" },
];

export const REPORTER_LABELS: Record<AgentReporterType, string> = {
  client:    "Client",
  driver:    "Chauffeur",
  deliverer: "Livreur",
  partner:   "Partenaire",
};

export const REPORTER_STYLES: Record<AgentReporterType, string> = {
  client:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  driver:    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40",
  deliverer: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40",
  partner:   "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/40",
};

export const CATEGORY_CONFIG: Record<AgentTicketCategory, { label: string; className: string }> = {
  payment:   { label: "Paiement",     className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40" },
  behavior:  { label: "Comportement", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40" },
  service:   { label: "Service",      className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40" },
  logistics: { label: "Logistique",   className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/40" },
  app:       { label: "Application",  className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/40" },
  other:     { label: "Autre",        className: "bg-surface-hover text-muted border-border" },
};

export const CATEGORY_FILTERS: { value: AgentTicketCategory | "all"; label: string }[] = [
  { value: "all",       label: "Toutes catégories" },
  { value: "payment",   label: "Paiement" },
  { value: "behavior",  label: "Comportement" },
  { value: "service",   label: "Service" },
  { value: "logistics", label: "Logistique" },
  { value: "app",       label: "Application" },
  { value: "other",     label: "Autre" },
];

export const PRIORITY_LABELS: Record<AdminSupportTicket["priority"], string> = {
  low:    "Basse",
  normal: "Normale",
  high:   "Haute",
};
