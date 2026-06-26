import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";

/**
 * Suivi de flotte partenaire — `GET /v1/partners/{id}/tracking` (DB-04, livré backend).
 * Vue agrégée : compteurs + missions en cours + chauffeurs disponibles avec
 * dernière position GPS et véhicule (couleur structurée). Pas de socket exposé
 * (cf. DB-05) → la page rafraîchit en polling HTTP.
 */

export interface TrackingVehicleColor {
  id?: string;
  code?: string;
  label?: string;
  hex?: string;
}

export interface TrackingPosition {
  lat: number;
  lng: number;
  heading?: number;
  speed_kmh?: number;
  recorded_at?: string;
}

export interface TrackingVehicle {
  id?: string;
  plateNumber?: string;
  colorId?: string;
  color?: TrackingVehicleColor | null;
}

/** Élément commun (mission active ou chauffeur disponible). */
export interface TrackingUnit {
  driver_id: string;
  driver_name: string;
  vehicle_label?: string;
  vehicle?: TrackingVehicle | null;
  position?: TrackingPosition | null;
  // Champs présents uniquement sur une mission active (forme défensive) :
  order_id?: string;
  order_ref?: string;
  status?: string;
  service_type?: string;
  destination?: string;
  pickup?: string;
  eta_min?: number;
}

export interface TrackingStats {
  drivers_online: number;
  drivers_on_trip: number;
  active_trips: number;
  avg_wait_min: number;
}

export interface PartnerTracking {
  generatedAt?: string;
  stats: TrackingStats;
  missions: TrackingUnit[];
  idleDrivers: TrackingUnit[];
}

interface ApiTrackingResponse {
  status?: string;
  generatedAt?: string;
  stats?: Partial<TrackingStats> | null;
  missions?: TrackingUnit[] | null;
  idleDrivers?: TrackingUnit[] | null;
}

function normalizeStats(stats?: Partial<TrackingStats> | null): TrackingStats {
  return {
    drivers_online: stats?.drivers_online ?? 0,
    drivers_on_trip: stats?.drivers_on_trip ?? 0,
    active_trips: stats?.active_trips ?? 0,
    avg_wait_min: stats?.avg_wait_min ?? 0,
  };
}

export const partnerTrackingService = {
  get: async (partnerId: string | number): Promise<PartnerTracking> => {
    const response = await apiClient.get<ApiTrackingResponse>(
      LINKS.partner.tracking(partnerId)
    );
    return {
      generatedAt: response.generatedAt,
      stats: normalizeStats(response.stats),
      missions: response.missions ?? [],
      idleDrivers: response.idleDrivers ?? [],
    };
  },
};
