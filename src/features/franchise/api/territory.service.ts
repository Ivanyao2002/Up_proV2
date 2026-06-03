import { apiClient } from "@/core/http/apiClient";
import type { FranchiseTerritory } from "@/shared/types";

export const franchiseTerritoryService = {
  get: () => apiClient.get<FranchiseTerritory>("/franchise/territory"),
};
