import type { PricingCountryCode } from "./pricingConfig.api.types";

export const holidaysKeys = {
  all: ["admin", "holidays"] as const,
  list: (countryCode?: PricingCountryCode) =>
    [...holidaysKeys.all, "list", countryCode ?? "all"] as const,
};
