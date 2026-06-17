/** GET /v1/drivers/:driverId/dispatch-eligibility — filtres géographiques dispatch */

export interface ApiZoneRef {
  id?: string;
  label?: string;
  code?: string;
  cityId?: string;
  name?: string;
}

export interface ApiDriverZoneFilter {
  mode?: string;
  exclusiveZoneId?: string;
  exclusive_zone_id?: string;
  exclusiveZone?: ApiZoneRef;
  exclusive_zone?: ApiZoneRef;
  checkDropoff?: boolean;
  check_dropoff?: boolean;
  active?: boolean;
  activatedAt?: string;
  activated_at?: string;
}

export interface ApiDriverHomeLocation {
  lat?: number;
  lng?: number;
  label?: string;
}

export interface ApiDriverHome {
  homeZoneId?: string;
  home_zone_id?: string;
  homeZone?: ApiZoneRef;
  home_zone?: ApiZoneRef;
  homeLocation?: ApiDriverHomeLocation;
  home_location?: ApiDriverHomeLocation;
  homeRadiusKm?: number;
  home_radius_km?: number;
}

export interface ApiDriverHeadingHome {
  enabled?: boolean;
  active?: boolean;
  activatedAt?: string;
  activated_at?: string;
  minProgressMeters?: number;
  min_progress_meters?: number;
  maxDetourKm?: number;
  max_detour_km?: number;
  corridorWidthKm?: number;
  corridor_width_km?: number;
  autoDisableOnArrival?: boolean;
  auto_disable_on_arrival?: boolean;
}

export interface ApiDriverDispatchPreferences {
  zoneFilter?: ApiDriverZoneFilter;
  zone_filter?: ApiDriverZoneFilter;
  home?: ApiDriverHome;
  headingHome?: ApiDriverHeadingHome;
  heading_home?: ApiDriverHeadingHome;
  blockedZones?: string[];
  blocked_zones?: string[];
  blockedZoneIds?: string[];
  blocked_zone_ids?: string[];
  preferredZones?: string[];
  preferred_zones?: string[];
  maxDistanceKm?: number | null;
  max_distance_km?: number | null;
}

export interface ApiDriverDispatchContext {
  lastLocation?: {
    lat?: number;
    lng?: number;
    recordedAt?: string;
    recorded_at?: string;
    zoneLabel?: string;
    zone_label?: string;
  };
  last_location?: ApiDriverDispatchContext["lastLocation"];
  distanceToHomeKm?: number | null;
  distance_to_home_km?: number | null;
  eligibleForOffers?: boolean;
  eligible_for_offers?: boolean;
  activeFilters?: string[];
  active_filters?: string[];
}

export interface ApiDriverDispatchEligibilityResponse {
  driverId?: string;
  driver_id?: string;
  preferences?: ApiDriverDispatchPreferences;
  dispatchContext?: ApiDriverDispatchContext;
  dispatch_context?: ApiDriverDispatchContext;
  status?: string;
}
