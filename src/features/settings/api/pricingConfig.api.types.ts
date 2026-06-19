/** GET/PATCH /v1/admin/pricing-config — moteur paliers (system_settings.pricing.config) */

export const PRICING_UEMOA_COUNTRIES = [
  "CI",
  "SN",
  "BF",
  "ML",
  "GN",
  "TG",
  "BJ",
] as const;

export type PricingCountryCode = (typeof PRICING_UEMOA_COUNTRIES)[number];

export const PRICING_VEHICLE_CATEGORIES = [
  "ECO",
  "CONFORT",
  "CONFORT+",
  "PREMIUM",
] as const;

export type PricingVehicleCategory = (typeof PRICING_VEHICLE_CATEGORIES)[number];

export interface PricingCategoryPremiums {
  ECO?: number;
  CONFORT?: number;
  "CONFORT+"?: number;
  PREMIUM?: number;
  [key: string]: number | undefined;
}

export interface PricingTripBandTariffs {
  baseFareXof: number;
  perKmXof: number;
  perMinuteXof: number;
  minimumFareXof: number;
  pickupBaseXof: number;
  pickupPerKmXof: number;
  pickupPerMinuteXof: number;
}

export interface PricingTripBand {
  id: string;
  label: string;
  minDistanceKm?: number | null;
  maxDistanceKm?: number | null;
  sameZoneRequired?: boolean;
  tariffs: PricingTripBandTariffs;
  categoryPremiumsXof?: PricingCategoryPremiums;
}

export interface PricingApproachDefaults {
  approachKm?: number;
  approachMin?: number;
}

export interface PricingZonePolicy {
  enabled?: boolean;
  sameZoneMaxDistanceKm?: number;
  zoneMatchRadiusKm?: number;
  hyperLocalDurationFallbackEnabled?: boolean;
  hyperLocalMaxDurationMin?: number;
}

export interface PricingRatioTier {
  maxRatio: number;
  multiplier: number;
}

export interface PricingLiveHeatTier {
  maxRatio: number;
  heatLevel: number;
}

export interface PricingHotZonePolicy {
  enabled?: boolean;
  zoneMatchRadiusKm?: number;
  heatMultipliers?: Record<string, number>;
  incrementPerHeatLevel?: number;
  combineMode?: "max" | "multiply" | "heat_only" | "supply_demand_only";
  useLiveDemandHeat?: boolean;
  liveHeatRatioTiers?: PricingLiveHeatTier[];
}

export interface PricingSupplyDemandPolicy {
  enabled?: boolean;
  pendingLookbackMin?: number;
  supplyRadiusKm?: number;
  ratioTiers?: PricingRatioTier[];
}

export interface PricingPeakHourProfile {
  id: string;
  label: string;
  hours: number[];
  days?: number[];
  zoneCode?: string;
  zoneCodes?: string[];
  trafficLevel?: string;
  durationMultiplier?: number;
  priceMultiplier?: number | null;
}

export interface PricingTrafficPolicy {
  enabled?: boolean;
  autoResolve?: boolean;
  defaultTrafficLevel?: string;
  urbanBaselineEnabled?: boolean;
  urbanBaselineMinDistanceKm?: number;
  urbanBaselineDurationMultiplier?: number;
  inferFromSupplyDemand?: boolean;
  supplyDenseRatioThreshold?: number;
  supplyBlockedRatioThreshold?: number;
  maxDurationMultiplier?: number;
  peakHourProfiles?: PricingPeakHourProfile[];
}

export interface PricingHolidayPolicy {
  enabled?: boolean;
  applyToDelivery?: boolean;
  maxCoefficient?: number;
}

export interface PricingCountryLayer {
  enabled?: boolean;
  competitorUndercutPct?: number;
  roundStepXof?: number;
  priceCapGlobal?: number;
  hybridRoutingEnabled?: boolean;
  defaultApproach?: PricingApproachDefaults;
  trafficMultipliers?: Record<string, number>;
  weatherMultipliers?: Record<string, number>;
  tripBands?: PricingTripBand[];
  zonePolicy?: PricingZonePolicy;
  hotZonePolicy?: PricingHotZonePolicy;
  supplyDemandPolicy?: PricingSupplyDemandPolicy;
  trafficPolicy?: PricingTrafficPolicy;
  holidayPolicy?: PricingHolidayPolicy;
}

export interface PricingConfigDocument {
  schemaVersion: number;
  global: PricingCountryLayer;
  countries: Partial<Record<PricingCountryCode, PricingCountryLayer>>;
}

export interface ApiPricingConfigResponse {
  status?: string;
  settingKey?: string;
  schemaVersion?: number;
  document?: PricingConfigDocument;
  fromDatabase?: boolean;
  seedTemplate?: PricingConfigDocument;
  effective?: PricingCountryLayer;
}
