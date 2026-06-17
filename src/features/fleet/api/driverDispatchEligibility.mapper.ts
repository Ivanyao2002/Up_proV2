import type {
  ApiDriverDispatchEligibilityResponse,
  ApiDriverDispatchPreferences,
  ApiDriverHeadingHome,
  ApiDriverHome,
  ApiDriverZoneFilter,
  ApiZoneRef,
} from "./driverDispatchEligibility.api.types";
import {
  formatActiveFilterLabel,
  isExclusiveZoneFilterActive,
  isHeadingHomeActive,
} from "../lib/driverDispatchFilters.labels";

export interface DriverDispatchFiltersView {
  driverId: string;
  exclusiveZoneActive: boolean;
  exclusiveZoneLabel: string | null;
  checkDropoff: boolean;
  headingHomeActive: boolean;
  homeZoneLabel: string | null;
  homeLocationLabel: string | null;
  homeRadiusKm: number | null;
  distanceToHomeKm: number | null;
  eligibleForOffers: boolean | null;
  activeFilters: string[];
  activeFilterLabels: string[];
  blockedZones: string[];
  maxDistanceKm: number | null;
  lastLocation: {
    lat: number;
    lng: number;
    zoneLabel?: string;
    recordedAt?: string;
  } | null;
  headingHomeConfig: {
    minProgressMeters?: number;
    maxDetourKm?: number;
    corridorWidthKm?: number;
    autoDisableOnArrival?: boolean;
    activatedAt?: string;
  } | null;
  zoneFilterActivatedAt: string | null;
}

function readZoneLabel(zone?: ApiZoneRef | null): string | null {
  if (!zone) return null;
  return zone.label?.trim() || zone.name?.trim() || zone.code?.trim() || null;
}

function readZoneFilter(
  preferences?: ApiDriverDispatchPreferences | null
): ApiDriverZoneFilter | null {
  return preferences?.zoneFilter ?? preferences?.zone_filter ?? null;
}

function readHome(
  preferences?: ApiDriverDispatchPreferences | null
): ApiDriverHome | null {
  return preferences?.home ?? null;
}

function readHeadingHome(
  preferences?: ApiDriverDispatchPreferences | null
): ApiDriverHeadingHome | null {
  return preferences?.headingHome ?? preferences?.heading_home ?? null;
}

function readStringList(...sources: (string[] | undefined)[]): string[] {
  for (const source of sources) {
    if (source?.length) return source.filter(Boolean);
  }
  return [];
}

export function mapApiDispatchEligibility(
  response: ApiDriverDispatchEligibilityResponse,
  fallbackDriverId: string
): DriverDispatchFiltersView {
  const preferences = response.preferences;
  const context = response.dispatchContext ?? response.dispatch_context;
  const zoneFilter = readZoneFilter(preferences);
  const home = readHome(preferences);
  const headingHome = readHeadingHome(preferences);

  const exclusiveZone =
    zoneFilter?.exclusiveZone ?? zoneFilter?.exclusive_zone ?? null;

  const exclusiveZoneLabel =
    readZoneLabel(exclusiveZone) ??
    zoneFilter?.exclusiveZoneId ??
    zoneFilter?.exclusive_zone_id ??
    null;

  const homeZoneLabel =
    readZoneLabel(home?.homeZone ?? home?.home_zone) ??
    home?.homeZoneId ??
    home?.home_zone_id ??
    null;

  const homeLocation = home?.homeLocation ?? home?.home_location;
  const homeLocationLabel =
    homeLocation?.label?.trim() ??
    (homeLocation?.lat != null && homeLocation?.lng != null
      ? `${homeLocation.lat.toFixed(4)}, ${homeLocation.lng.toFixed(4)}`
      : null);

  const lastRaw = context?.lastLocation ?? context?.last_location;
  const lastLocation =
    lastRaw?.lat != null && lastRaw?.lng != null
      ? {
          lat: lastRaw.lat,
          lng: lastRaw.lng,
          zoneLabel: lastRaw.zoneLabel ?? lastRaw.zone_label,
          recordedAt: lastRaw.recordedAt ?? lastRaw.recorded_at,
        }
      : null;

  const activeFilters =
    context?.activeFilters ?? context?.active_filters ?? [];

  const exclusiveZoneActive =
    activeFilters.some((f) => f.startsWith("exclusive_zone")) ||
    isExclusiveZoneFilterActive(zoneFilter?.mode, zoneFilter?.active);

  const headingHomeActive =
    activeFilters.includes("heading_home") || isHeadingHomeActive(headingHome);

  return {
    driverId: response.driverId ?? response.driver_id ?? fallbackDriverId,
    exclusiveZoneActive,
    exclusiveZoneLabel,
    checkDropoff: Boolean(
      zoneFilter?.checkDropoff ?? zoneFilter?.check_dropoff
    ),
    headingHomeActive,
    homeZoneLabel,
    homeLocationLabel,
    homeRadiusKm:
      home?.homeRadiusKm ?? home?.home_radius_km ?? null,
    distanceToHomeKm:
      context?.distanceToHomeKm ?? context?.distance_to_home_km ?? null,
    eligibleForOffers:
      context?.eligibleForOffers ?? context?.eligible_for_offers ?? null,
    activeFilters,
    activeFilterLabels: activeFilters.map(formatActiveFilterLabel),
    blockedZones: readStringList(
      preferences?.blockedZones,
      preferences?.blocked_zones,
      preferences?.blockedZoneIds,
      preferences?.blocked_zone_ids
    ),
    maxDistanceKm:
      preferences?.maxDistanceKm ?? preferences?.max_distance_km ?? null,
    lastLocation,
    headingHomeConfig: headingHome
      ? {
          minProgressMeters:
            headingHome.minProgressMeters ?? headingHome.min_progress_meters,
          maxDetourKm: headingHome.maxDetourKm ?? headingHome.max_detour_km,
          corridorWidthKm:
            headingHome.corridorWidthKm ?? headingHome.corridor_width_km,
          autoDisableOnArrival:
            headingHome.autoDisableOnArrival ??
            headingHome.auto_disable_on_arrival,
          activatedAt:
            headingHome.activatedAt ?? headingHome.activated_at,
        }
      : null,
    zoneFilterActivatedAt:
      zoneFilter?.activatedAt ?? zoneFilter?.activated_at ?? null,
  };
}
