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
