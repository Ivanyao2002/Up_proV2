import type { DriversListParams } from "./drivers.service";

export const driversKeys = {
  all: ["fleet", "drivers"] as const,
  list: (filters?: DriversListParams) =>
    [...driversKeys.all, "list", filters] as const,
};
