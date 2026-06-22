import type { DisputeCategory, DisputeStatus } from "../api/dispute.types";

export const STATUS_LABELS: Record<DisputeStatus, string> = {
  open:        "Ouvert",
  in_progress: "En cours",
  resolved:    "Résolu",
  closed:      "Clôturé",
  escalated:   "Escaladé",
};

export const STATUS_COLORS: Record<DisputeStatus, string> = {
  open:        "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400",
  in_progress: "border-blue-400/40 bg-blue-400/10 text-blue-600 dark:text-blue-400",
  resolved:    "border-teal-400/40 bg-teal-400/10 text-teal-600 dark:text-teal-400",
  closed:      "border-border bg-canvas text-muted",
  escalated:   "border-red-400/40 bg-red-400/10 text-red-600 dark:text-red-400",
};

export const STATUS_FILTERS: { value: DisputeStatus | "all"; label: string }[] = [
  { value: "all",         label: "Tous" },
  { value: "open",        label: "Ouverts" },
  { value: "in_progress", label: "En cours" },
  { value: "escalated",   label: "Escaladés" },
  { value: "resolved",    label: "Résolus" },
  { value: "closed",      label: "Clôturés" },
];

export const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  payment:   "Facturation",
  behavior:  "Comportement",
  service:   "Trajet",
  logistics: "Livraison",
  app:       "Bug app",
  other:     "Autre",
};

export const CATEGORY_COLORS: Record<DisputeCategory, string> = {
  payment:   "border-red-400/40 bg-red-400/10 text-red-600 dark:text-red-400",
  behavior:  "border-orange-400/40 bg-orange-400/10 text-orange-600 dark:text-orange-400",
  service:   "border-blue-400/40 bg-blue-400/10 text-blue-600 dark:text-blue-400",
  logistics: "border-purple-400/40 bg-purple-400/10 text-purple-600 dark:text-purple-400",
  app:       "border-zinc-400/40 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
  other:     "border-border bg-canvas text-muted",
};

export const CATEGORY_FILTERS: { value: DisputeCategory | "all"; label: string }[] = [
  { value: "all",       label: "Toutes catégories" },
  { value: "payment",   label: "Facturation" },
  { value: "behavior",  label: "Comportement" },
  { value: "service",   label: "Trajet" },
  { value: "logistics", label: "Livraison" },
  { value: "app",       label: "Bug app" },
  { value: "other",     label: "Autre" },
];

export const TERMINAL_STATUSES: DisputeStatus[] = ["resolved", "closed", "escalated"];
