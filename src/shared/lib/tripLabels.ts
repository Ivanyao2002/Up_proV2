import type { Trip, TripService, TripStatus } from "@/shared/types";

export const SERVICE_LABELS: Record<TripService, string> = {
  taxi: "Taxi",
  delivery: "Livraison",
  rental: "Location",
  freight: "Fret",
};

export const STATUS_FILTER_OPTIONS: { value: TripStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "in_progress", label: "En cours" },
  { value: "assigned", label: "Assignées" },
  { value: "matching", label: "Recherche" },
  { value: "requested", label: "Demandées" },
  { value: "completed", label: "Terminées" },
  { value: "cancelled", label: "Annulées" },
];

export function getServiceLabel(service: Trip["service"]): string {
  return SERVICE_LABELS[service];
}

const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  requested: "Demandée",
  matching: "Recherche",
  assigned: "Assignée",
  arrived: "Arrivée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function getTripStatusLabel(status: TripStatus): string {
  return TRIP_STATUS_LABELS[status];
}
