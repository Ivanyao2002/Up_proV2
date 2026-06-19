import type {
  DispatchConfigDocument,
  DispatchServiceKey,
  DispatchServiceLayer,
  DispatchTrafficZoneProfile,
  DispatchWaveScheduleEntry,
} from "./dispatchConfig.api.types";

const DEFAULT_ZONE_PROFILES: DispatchTrafficZoneProfile[] = [
  {
    id: "plateau_peak",
    zoneCode: "PLATEAU",
    label: "Plateau",
    hours: [7, 8, 9, 17, 18, 19],
    etaMultiplier: 1.35,
    radiusBonusKm: 1,
  },
  {
    id: "cocody_peak",
    zoneCode: "COCODY",
    label: "Cocody",
    hours: [7, 8, 9, 17, 18, 19],
    etaMultiplier: 1.3,
    radiusBonusKm: 1,
  },
  {
    id: "adjame_peak",
    zoneCode: "ADJAME",
    label: "Adjamé",
    hours: [7, 8, 9, 17, 18, 19],
    etaMultiplier: 1.45,
    radiusBonusKm: 1.5,
  },
  {
    id: "yopougon_peak",
    zoneCode: "YOPOUGON",
    label: "Yopougon",
    hours: [7, 8, 9, 17, 18, 19],
    etaMultiplier: 1.25,
    radiusBonusKm: 0.5,
  },
];

function buildFullStrategies(zoneProfiles = DEFAULT_ZONE_PROFILES) {
  return {
    preset: "full" as const,
    routing: { mode: "osrm" as const, fallbackToHaversine: true, maxEtaMinutes: 20 },
    scoring: {
      mode: "dynamic" as const,
      dynamic: {
        proximity: 0.35,
        rating: 0.2,
        reliability: 0.15,
        acceptRate: 0.15,
        idleBonus: 0.1,
        refusalPenalty: 0.05,
        chainPenalty: 0.05,
      },
    },
    offers: { mode: "sequential" as const, batchSize: 8, sequentialQueueSize: 15 },
    autoAssign: { enabled: true, minScoreGap: 0.18, maxEtaMinutes: 4 },
    heatmap: { enabled: true, radiusBonusKm: 2, lookbackHours: 168 },
    fairness: { enabled: true, maxAssignmentsPerHour: 6, penaltyPerExtraAssignment: 0.08 },
    penalties: {
      enabled: true,
      scoreReductionPerRefusal: 0.12,
      penaltyTtlMinutes: 2,
      consecutiveRefusalThreshold: 3,
    },
    urgency: {
      enabled: true,
      waveIntervalSec: 4,
      radiusBonusKm: 2,
      emergencyChainEarly: true,
      metadataFlags: ["urgent", "priority", "vip"],
    },
    scheduled: { enabled: true, leadTimeMinutes: 30 },
    reposition: { enabled: true, idleMinutesThreshold: 10, demandRadiusKm: 5 },
    batchMatching: { enabled: true, maxOrdersPerPass: 25, holdTtlSeconds: 90 },
    geoIndex: { enabled: true, key: "drivers:geo" },
    traffic: {
      enabled: true,
      useZoneProfiles: true,
      useLiveTraffic: true,
      maxEtaMultiplier: 1.8,
      levels: { fluid: 0.95, normal: 1, dense: 1.25, blocked: 1.5 },
      zoneProfiles: zoneProfiles.map((p) => ({ ...p })),
    },
  };
}

export function buildDefaultDispatchServiceLayer(
  service: DispatchServiceKey
): DispatchServiceLayer {
  const isRide = service === "RIDE";
  return {
    maxRadiusKm: 2,
    candidateLimit: isRide ? 8 : 10,
    driverSearchLimit: 500,
    minDriverWalletBalanceXof: 0,
    offerTtlSeconds: 12,
    autoAssign: false,
    weights: {
      distance: isRide ? 0.7 : 0.75,
      rating: isRide ? 0.2 : 0.15,
      reliability: 0.1,
    },
    wave: {
      radiusIncrementKm: 2,
      maxRadiusKmCap: 4,
      maxWaves: 2,
      waveIntervalSec: 12,
      globalTimeoutSec: 120,
    },
    chain: {
      tripMaxEtaMinutes: 5,
      tripMinProgress: 0.5,
      radiusBonusKm: 2,
      emergencyEnabled: true,
      emergencyTripMaxEtaMinutes: 8,
      emergencyTripMinProgress: 0.35,
      emergencyRadiusBonusKm: 4,
    },
    strategies: buildFullStrategies(),
  };
}

export function buildDefaultDispatchConfigDocument(): DispatchConfigDocument {
  return {
    schemaVersion: 2,
    global: {
      RIDE: buildDefaultDispatchServiceLayer("RIDE"),
      DELIVERY_CARGO: buildDefaultDispatchServiceLayer("DELIVERY_CARGO"),
    },
    countries: {},
  };
}

export function computeWaveSchedule(layer: DispatchServiceLayer): DispatchWaveScheduleEntry[] {
  const maxRadius = layer.maxRadiusKm ?? 2;
  const increment = layer.wave?.radiusIncrementKm ?? 2;
  const cap = layer.wave?.maxRadiusKmCap ?? 4;
  const waves = layer.wave?.maxWaves ?? 2;
  const schedule: DispatchWaveScheduleEntry[] = [];
  for (let i = 0; i < waves; i++) {
    schedule.push({
      wave: i + 1,
      radiusKm: Math.min(maxRadius + i * increment, cap),
    });
  }
  return schedule;
}
