import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type {
  ApiPricingConfigResponse,
  PricingConfigDocument,
  PricingCountryCode,
  PricingCountryLayer,
} from "./pricingConfig.api.types";
import { buildDefaultPricingConfigDocument } from "./pricingConfig.defaults";

export function isLegacyPricingConfig(): boolean {
  return false;
}

function withCountryQuery(countryCode: PricingCountryCode): string {
  return `${LINKS.admin.v1.pricingConfig}?countryCode=${countryCode}`;
}

export const pricingConfigService = {
  get: (countryCode: PricingCountryCode = "CI") =>
    apiClient.get<ApiPricingConfigResponse>(withCountryQuery(countryCode)),

  putDocument: (document: PricingConfigDocument) =>
    apiClient.put<ApiPricingConfigResponse>(LINKS.admin.v1.pricingConfig, document),

  patchCountry: (
    countryCode: PricingCountryCode,
    layer: Partial<PricingCountryLayer>
  ) =>
    apiClient.patch<ApiPricingConfigResponse>(
      LINKS.admin.v1.pricingConfigCountry(countryCode),
      layer
    ),

  resetCountryFromSeed: async (
    countryCode: PricingCountryCode
  ): Promise<ApiPricingConfigResponse> => {
    const current = await pricingConfigService.get(countryCode);
    const seed =
      current.seedTemplate ?? buildDefaultPricingConfigDocument();
    const countryLayer = seed.countries[countryCode];
    if (!countryLayer) {
      return pricingConfigService.patchCountry(countryCode, {});
    }
    return pricingConfigService.patchCountry(countryCode, countryLayer);
  },
};
