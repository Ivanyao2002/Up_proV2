import type { Driver } from "@/shared/types";

const ACCOUNT_LABELS: Record<Driver["account_status"], string> = {
  pending: "En attente",
  approved: "Approuvé",
  suspended: "Suspendu",
  banned: "Banni",
};

const AVAIL_LABELS: Record<Driver["availability"], string> = {
  offline: "Hors ligne",
  online: "En ligne",
  on_trip: "En course",
  paused: "Pause",
};

export function getDriverAccountStatusLabel(status: Driver["account_status"]): string {
  return ACCOUNT_LABELS[status];
}

export function getDriverAvailabilityLabel(status: Driver["availability"]): string {
  return AVAIL_LABELS[status];
}

export const DRIVER_ACCOUNT_STATUS_FILTER_OPTIONS: {
  value: Driver["account_status"] | "all";
  label: string;
}[] = [
  { value: "all", label: "Tous" },
  { value: "approved", label: "Approuvés" },
  { value: "pending", label: "En attente" },
  { value: "suspended", label: "Suspendus" },
  { value: "banned", label: "Bannis" },
];

export const DRIVER_AVAILABILITY_FILTER_OPTIONS: {
  value: Driver["availability"] | "all";
  label: string;
}[] = [
  { value: "all", label: "Toutes" },
  { value: "online", label: "En ligne" },
  { value: "on_trip", label: "En course" },
  { value: "offline", label: "Hors ligne" },
  { value: "paused", label: "En pause" },
];
