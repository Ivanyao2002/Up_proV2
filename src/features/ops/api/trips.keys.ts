import type { TripStatus } from "@/shared/types";

export const tripsKeys = {
  all: ["ops", "trips"] as const,
  list: (status?: TripStatus | "all") => [...tripsKeys.all, "list", status] as const,
};
