import type { PricingCountryCode } from "./pricingConfig.api.types";

export const pricingConfigKeys = {
  all: ["settings", "pricing-config"] as const,
  detail: (countryCode: PricingCountryCode) =>
    [...pricingConfigKeys.all, countryCode] as const,
};
