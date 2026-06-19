import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type {
  ApiDispatchConfigResponse,
  DispatchCapacityResponse,
  DispatchConfigDocument,
  DispatchCountryCode,
  DispatchCountryPatch,
} from "./dispatchConfig.api.types";
import { buildDefaultDispatchConfigDocument } from "./dispatchConfig.defaults";

function withCountryQuery(countryCode: DispatchCountryCode): string {
  return `${LINKS.admin.v1.dispatchConfig}?countryCode=${countryCode}`;
}

export const dispatchConfigService = {
  get: (countryCode: DispatchCountryCode = "CI") =>
    apiClient.get<ApiDispatchConfigResponse>(withCountryQuery(countryCode)),

  putDocument: (document: DispatchConfigDocument) =>
    apiClient.put<ApiDispatchConfigResponse>(LINKS.admin.v1.dispatchConfig, document),

  patchCountry: (countryCode: DispatchCountryCode, patch: DispatchCountryPatch) =>
    apiClient.patch<ApiDispatchConfigResponse>(
      LINKS.admin.v1.dispatchConfigCountry(countryCode),
      patch
    ),

  getCapacity: (countryCode: DispatchCountryCode = "CI") =>
    apiClient.get<DispatchCapacityResponse>(
      `${LINKS.admin.v1.dispatchCapacity}?countryCode=${countryCode}`
    ),

  resetCountryFromSeed: async (
    countryCode: DispatchCountryCode
  ): Promise<ApiDispatchConfigResponse> => {
    const current = await dispatchConfigService.get(countryCode);
    const seed = current.seedTemplate ?? buildDefaultDispatchConfigDocument();
    const countryLayer = seed.countries[countryCode];
    if (!countryLayer) {
      return dispatchConfigService.patchCountry(countryCode, {});
    }
    return dispatchConfigService.patchCountry(countryCode, countryLayer);
  },
};
