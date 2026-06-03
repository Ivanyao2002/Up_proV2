import type { LiveMapScopeFiltersValue } from "./liveMap.types";

export const liveMapKeys = {
  all: ["ops", "live-map"] as const,
  admin: (filters?: LiveMapScopeFiltersValue) =>
    [
      ...liveMapKeys.all,
      "admin",
      filters?.franchiseId ?? null,
      filters?.partnerId ?? null,
    ] as const,
};
