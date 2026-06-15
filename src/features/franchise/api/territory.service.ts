import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { FranchiseTerritory } from "@/shared/types";

export interface ExtensionRequestPayload {
  zone_ids: string[];
  notes?: string;
}

export const franchiseTerritoryService = {
  get: () =>
    useLegacyPortalApi()
      ? apiClient.get<FranchiseTerritory>("/franchise/territory")
      : apiClient.get<FranchiseTerritory>(LINKS.franchise.v1.territory),

  requestExtension: (payload: ExtensionRequestPayload) =>
    apiClient.post<{ status: string }>(LINKS.franchise.v1.extensionRequest, payload),
};
