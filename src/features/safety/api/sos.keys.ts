import type { SosListParams } from "./sos.types";

export const sosKeys = {
  all: ["safety", "sos"] as const,
  dashboard: () => [...sosKeys.all, "dashboard"] as const,
  list: (params?: SosListParams) => [...sosKeys.all, "list", params] as const,
  detail: (id: string) => [...sosKeys.all, "detail", id] as const,
};
