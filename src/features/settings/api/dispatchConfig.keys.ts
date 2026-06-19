import type { DispatchCountryCode } from "./dispatchConfig.api.types";

export const dispatchConfigKeys = {
  all: ["admin", "dispatch-config"] as const,
  detail: (countryCode: DispatchCountryCode) =>
    [...dispatchConfigKeys.all, "detail", countryCode] as const,
  capacity: (countryCode: DispatchCountryCode) =>
    [...dispatchConfigKeys.all, "capacity", countryCode] as const,
};
