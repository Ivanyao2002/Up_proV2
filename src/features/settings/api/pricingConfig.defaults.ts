import type {
  PricingCategoryPremiums,
  PricingConfigDocument,
  PricingCountryLayer,
  PricingTripBand,
  PricingTripBandTariffs,
} from "./pricingConfig.api.types";

const DEFAULT_TARIFFS = (
  patch: Partial<PricingTripBandTariffs>
): PricingTripBandTariffs => ({
  baseFareXof: 500,
  perKmXof: 145,
  perMinuteXof: 30,
  minimumFareXof: 0,
  pickupBaseXof: 500,
  pickupPerKmXof: 50,
  pickupPerMinuteXof: 15,
  ...patch,
});

const DEFAULT_PREMIUMS = (
  patch: Partial<PricingCategoryPremiums>
): PricingCategoryPremiums => ({
  ECO: 0,
  CONFORT: 200,
  "CONFORT+": 300,
  PREMIUM: 1200,
  ...patch,
});

export const DEFAULT_TRIP_BANDS: PricingTripBand[] = [
  {
    id: "hyper_local",
    label: "Hyper-local (même zone, ≤4 km)",
    maxDistanceKm: 4,
    sameZoneRequired: true,
    tariffs: DEFAULT_TARIFFS({
      baseFareXof: 300,
      perKmXof: 50,
      perMinuteXof: 18,
      pickupBaseXof: 300,
      pickupPerKmXof: 30,
      pickupPerMinuteXof: 10,
    }),
    categoryPremiumsXof: DEFAULT_PREMIUMS({
      CONFORT: 100,
      "CONFORT+": 200,
      PREMIUM: 400,
    }),
  },
  {
    id: "short",
    label: "Court inter-quartiers (≤8 km)",
    maxDistanceKm: 8,
    sameZoneRequired: false,
    tariffs: DEFAULT_TARIFFS({
      baseFareXof: 600,
      perKmXof: 180,
      perMinuteXof: 40,
    }),
    categoryPremiumsXof: DEFAULT_PREMIUMS({}),
  },
  {
    id: "long",
    label: "Long urbain (8–25 km)",
    maxDistanceKm: 25,
    sameZoneRequired: false,
    tariffs: DEFAULT_TARIFFS({
      baseFareXof: 500,
      perKmXof: 145,
      perMinuteXof: 30,
    }),
    categoryPremiumsXof: DEFAULT_PREMIUMS({}),
  },
  {
    id: "intercity",
    label: "Inter-villes (>25 km)",
    minDistanceKm: 25,
    maxDistanceKm: null,
    sameZoneRequired: false,
    tariffs: DEFAULT_TARIFFS({
      baseFareXof: 500,
      perKmXof: 175,
      perMinuteXof: 28,
    }),
    categoryPremiumsXof: DEFAULT_PREMIUMS({
      CONFORT: 1200,
      "CONFORT+": 3300,
      PREMIUM: 13500,
    }),
  },
];

export const CI_TRIP_BAND_OVERRIDES: PricingTripBand[] = [
  {
    ...DEFAULT_TRIP_BANDS[0],
    categoryPremiumsXof: DEFAULT_TRIP_BANDS[0].categoryPremiumsXof,
  },
  {
    ...DEFAULT_TRIP_BANDS[1],
    categoryPremiumsXof: DEFAULT_TRIP_BANDS[1].categoryPremiumsXof,
  },
  {
    ...DEFAULT_TRIP_BANDS[2],
    categoryPremiumsXof: DEFAULT_PREMIUMS({ PREMIUM: 1800 }),
  },
  {
    id: "intercity",
    label: "Inter-villes (>25 km)",
    minDistanceKm: 25,
    maxDistanceKm: null,
    sameZoneRequired: false,
    tariffs: DEFAULT_TARIFFS({
      baseFareXof: 500,
      perKmXof: 270,
      perMinuteXof: 32,
    }),
    categoryPremiumsXof: DEFAULT_PREMIUMS({
      CONFORT: 3200,
      "CONFORT+": 5900,
      PREMIUM: 17300,
    }),
  },
];

export function buildDefaultPricingCountryLayer(): PricingCountryLayer {
  return {
    enabled: true,
    competitorUndercutPct: 20,
    roundStepXof: 50,
    priceCapGlobal: 2.5,
    hybridRoutingEnabled: true,
    defaultApproach: { approachKm: 1.5, approachMin: 4 },
    trafficMultipliers: {
      fluid: 0.95,
      normal: 1,
      dense: 1.2,
      blocked: 1.45,
    },
    weatherMultipliers: {
      clear: 1,
      rain: 1.15,
      storm: 1.35,
      heat: 1.1,
    },
    tripBands: DEFAULT_TRIP_BANDS.map((b) => ({ ...b, tariffs: { ...b.tariffs } })),
    zonePolicy: {
      enabled: true,
      sameZoneMaxDistanceKm: 4,
      zoneMatchRadiusKm: 2.5,
      hyperLocalDurationFallbackEnabled: true,
      hyperLocalMaxDurationMin: 6,
    },
    hotZonePolicy: {
      enabled: true,
      zoneMatchRadiusKm: 2.5,
      heatMultipliers: {
        "0": 1,
        "1": 1.1,
        "2": 1.2,
        "3": 1.3,
        "4": 1.45,
        "5": 1.6,
      },
      incrementPerHeatLevel: 0.1,
      combineMode: "max",
      useLiveDemandHeat: true,
      liveHeatRatioTiers: [
        { maxRatio: 0.5, heatLevel: 0 },
        { maxRatio: 1, heatLevel: 2 },
        { maxRatio: 1.5, heatLevel: 3 },
        { maxRatio: 2, heatLevel: 4 },
        { maxRatio: 999, heatLevel: 5 },
      ],
    },
    supplyDemandPolicy: {
      enabled: true,
      pendingLookbackMin: 15,
      supplyRadiusKm: 5,
      ratioTiers: [
        { maxRatio: 1, multiplier: 1 },
        { maxRatio: 1.5, multiplier: 1.1 },
        { maxRatio: 2, multiplier: 1.2 },
        { maxRatio: 3, multiplier: 1.3 },
        { maxRatio: 999, multiplier: 1.38 },
      ],
    },
    trafficPolicy: {
      enabled: true,
      autoResolve: true,
      defaultTrafficLevel: "normal",
      urbanBaselineEnabled: true,
      urbanBaselineMinDistanceKm: 5,
      urbanBaselineDurationMultiplier: 1.35,
      inferFromSupplyDemand: true,
      supplyDenseRatioThreshold: 1.2,
      supplyBlockedRatioThreshold: 2,
      maxDurationMultiplier: 1.6,
      peakHourProfiles: [
        {
          id: "abidjan_morning",
          label: "Abidjan pointe matin",
          hours: [7, 8, 9],
          trafficLevel: "dense",
          durationMultiplier: 1.35,
        },
        {
          id: "abidjan_evening",
          label: "Abidjan pointe soir",
          hours: [17, 18, 19],
          trafficLevel: "dense",
          durationMultiplier: 1.4,
        },
        {
          id: "plateau_peak",
          label: "Plateau",
          zoneCode: "PLATEAU",
          hours: [7, 8, 9, 17, 18, 19],
          trafficLevel: "dense",
          durationMultiplier: 1.35,
        },
        {
          id: "cocody_peak",
          label: "Cocody",
          zoneCode: "COCODY",
          hours: [7, 8, 9, 17, 18, 19],
          trafficLevel: "dense",
          durationMultiplier: 1.3,
        },
        {
          id: "adjame_peak",
          label: "Adjamé",
          zoneCode: "ADJAME",
          hours: [7, 8, 9, 17, 18, 19],
          trafficLevel: "blocked",
          durationMultiplier: 1.45,
        },
        {
          id: "yopougon_peak",
          label: "Yopougon",
          zoneCode: "YOPOUGON",
          hours: [7, 8, 9, 17, 18, 19],
          trafficLevel: "dense",
          durationMultiplier: 1.25,
        },
      ],
    },
    holidayPolicy: {
      enabled: true,
      applyToDelivery: true,
      maxCoefficient: 2,
    },
  };
}

export function buildDefaultPricingConfigDocument(): PricingConfigDocument {
  return {
    schemaVersion: 3,
    global: buildDefaultPricingCountryLayer(),
    countries: {
      CI: {
        tripBands: CI_TRIP_BAND_OVERRIDES.map((b) => ({
          ...b,
          tariffs: { ...b.tariffs },
          categoryPremiumsXof: { ...b.categoryPremiumsXof },
        })),
      },
    },
  };
}
