import type { PricingCountryCode } from "./pricingConfig.api.types";

export type DispatchCountryCode = PricingCountryCode;
export type DispatchServiceKey = "RIDE" | "DELIVERY_CARGO";
export type DispatchPreset = "legacy" | "pro" | "full";
export type DispatchRoutingMode = "haversine" | "osrm" | "mapbox" | "hybrid";
export type DispatchOfferMode = "sequential" | "batch";
export type DispatchScoringMode = "legacy" | "dynamic";

export interface DispatchWaveConfig {
  radiusIncrementKm?: number;
  maxRadiusKmCap?: number;
  maxWaves?: number;
  waveIntervalSec?: number;
  globalTimeoutSec?: number;
}

export interface DispatchChainConfig {
  tripMaxEtaMinutes?: number;
  tripMinProgress?: number;
  radiusBonusKm?: number;
  emergencyEnabled?: boolean;
  emergencyTripMaxEtaMinutes?: number;
  emergencyTripMinProgress?: number;
  emergencyRadiusBonusKm?: number;
}

export interface DispatchRoutingConfig {
  mode?: DispatchRoutingMode;
  fallbackToHaversine?: boolean;
  maxEtaMinutes?: number;
}

export interface DispatchLegacyWeights {
  distance?: number;
  rating?: number;
  reliability?: number;
}

export interface DispatchDynamicScoring {
  proximity?: number;
  rating?: number;
  reliability?: number;
  acceptRate?: number;
  idleBonus?: number;
  refusalPenalty?: number;
  chainPenalty?: number;
}

export interface DispatchScoringConfig {
  mode?: DispatchScoringMode;
  dynamic?: DispatchDynamicScoring;
}

export interface DispatchOffersConfig {
  mode?: DispatchOfferMode;
  batchSize?: number;
  sequentialQueueSize?: number;
}

export interface DispatchAutoAssignConfig {
  enabled?: boolean;
  minScoreGap?: number;
  maxEtaMinutes?: number;
}

export interface DispatchHeatmapConfig {
  enabled?: boolean;
  radiusBonusKm?: number;
  lookbackHours?: number;
}

export interface DispatchFairnessConfig {
  enabled?: boolean;
  maxAssignmentsPerHour?: number;
  penaltyPerExtraAssignment?: number;
}

export interface DispatchPenaltiesConfig {
  enabled?: boolean;
  scoreReductionPerRefusal?: number;
  penaltyTtlMinutes?: number;
  consecutiveRefusalThreshold?: number;
}

export interface DispatchUrgencyConfig {
  enabled?: boolean;
  waveIntervalSec?: number;
  radiusBonusKm?: number;
  emergencyChainEarly?: boolean;
  metadataFlags?: string[];
}

export interface DispatchScheduledConfig {
  enabled?: boolean;
  leadTimeMinutes?: number;
}

export interface DispatchRepositionConfig {
  enabled?: boolean;
  idleMinutesThreshold?: number;
  demandRadiusKm?: number;
}

export interface DispatchBatchMatchingConfig {
  enabled?: boolean;
  maxOrdersPerPass?: number;
  holdTtlSeconds?: number;
}

export interface DispatchGeoIndexConfig {
  enabled?: boolean;
  key?: string;
}

export interface DispatchTrafficZoneProfile {
  id?: string;
  zoneCode?: string;
  zoneId?: string;
  label: string;
  hours: number[];
  days?: number[];
  etaMultiplier?: number;
  radiusBonusKm?: number;
}

export interface DispatchWeatherProfile {
  etaMultiplier?: number;
  radiusBonusKm?: number;
}

export interface DispatchTrafficConfig {
  enabled?: boolean;
  useZoneProfiles?: boolean;
  useLiveTraffic?: boolean;
  maxEtaMultiplier?: number;
  levels?: Record<string, number>;
  zoneProfiles?: DispatchTrafficZoneProfile[];
  weather?: Record<string, DispatchWeatherProfile>;
}

export interface DispatchStrategies {
  preset?: DispatchPreset;
  routing?: DispatchRoutingConfig;
  scoring?: DispatchScoringConfig;
  offers?: DispatchOffersConfig;
  autoAssign?: DispatchAutoAssignConfig;
  heatmap?: DispatchHeatmapConfig;
  fairness?: DispatchFairnessConfig;
  penalties?: DispatchPenaltiesConfig;
  urgency?: DispatchUrgencyConfig;
  scheduled?: DispatchScheduledConfig;
  reposition?: DispatchRepositionConfig;
  batchMatching?: DispatchBatchMatchingConfig;
  geoIndex?: DispatchGeoIndexConfig;
  traffic?: DispatchTrafficConfig;
}

export interface DispatchServiceLayer {
  maxRadiusKm?: number;
  candidateLimit?: number;
  driverSearchLimit?: number;
  minDriverWalletBalanceXof?: number;
  offerTtlSeconds?: number;
  autoAssign?: boolean;
  weights?: DispatchLegacyWeights;
  wave?: DispatchWaveConfig;
  chain?: DispatchChainConfig;
  strategies?: DispatchStrategies;
}

export interface DispatchCountryPatch {
  RIDE?: Partial<DispatchServiceLayer>;
  DELIVERY_CARGO?: Partial<DispatchServiceLayer>;
}

export interface DispatchWaveScheduleEntry {
  wave: number;
  radiusKm: number;
}

export interface DispatchConfigDocument {
  schemaVersion: number;
  global: Record<DispatchServiceKey, DispatchServiceLayer>;
  countries: Partial<Record<DispatchCountryCode, DispatchCountryPatch>>;
}

export interface ApiDispatchConfigResponse {
  status?: string;
  settingKey?: string;
  schemaVersion?: number;
  document?: DispatchConfigDocument;
  seedTemplate?: DispatchConfigDocument;
  effective?: {
    countryCode: string;
    RIDE?: DispatchServiceLayer;
    DELIVERY_CARGO?: DispatchServiceLayer;
  };
  waveSchedule?: Partial<Record<DispatchServiceKey, DispatchWaveScheduleEntry[]>>;
}

export interface DispatchCapacityZone {
  zoneCode: string;
  online: number;
  eligible: number;
}

export interface DispatchCapacityResponse {
  status?: string;
  countryCode: string;
  onlineDrivers?: number;
  eligibleDrivers?: number;
  indexedDrivers?: number;
  byZone?: DispatchCapacityZone[];
}
