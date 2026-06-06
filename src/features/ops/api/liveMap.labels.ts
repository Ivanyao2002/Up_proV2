/** Libellés statuts commande API → UI (carte live). */

export const LIVE_MAP_ORDER_STATUS_LABELS: Record<string, string> = {
  requested: "Demandée",
  dispatching: "Recherche chauffeur",
  matching: "Recherche chauffeur",
  assigned: "Assignée",
  accepted: "Acceptée",
  arrived: "Arrivé",
  in_progress: "En cours",
  started: "Démarrée",
  picked_up: "Colis récupéré",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function liveMapOrderStatusLabel(status?: string): string {
  const key = String(status ?? "").toLowerCase();
  return LIVE_MAP_ORDER_STATUS_LABELS[key] ?? status ?? "—";
}

const DRIVER_ON_TRIP_STATUSES = new Set([
  "on_trip",
  "on-trip",
  "busy",
  "in_progress",
  "on_ride",
]);

export function isDriverOnTripStatus(status?: string): boolean {
  return DRIVER_ON_TRIP_STATUSES.has(String(status ?? "").toLowerCase());
}

/** Course considérée comme « en cours » pour un chauffeur */
export const LIVE_MAP_ACTIVE_TRIP_STATUSES = new Set([
  "assigned",
  "accepted",
  "arrived",
  "in_progress",
  "started",
  "picked_up",
]);
