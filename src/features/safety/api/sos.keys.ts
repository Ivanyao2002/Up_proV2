import type { SosListParams } from "./sos.types";

export const sosKeys = {
  all: ["safety", "sos"] as const,
  dashboard: () => [...sosKeys.all, "dashboard"] as const,
  /** Clé dédiée au polling sonore : évite le partage de cache avec le dashboard
   * (intervalles différents = double charge non déterministe — #34 audit UX). */
  dashboardSound: () => [...sosKeys.dashboard(), "sound"] as const,
  list: (params?: SosListParams) => [...sosKeys.all, "list", params] as const,
  detail: (id: string) => [...sosKeys.all, "detail", id] as const,
};
