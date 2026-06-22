import { LINKS } from "@/core/api/links";
import { apiClient } from "@/core/http/apiClient";
import { mapComptaDashboard, mapComptaMe } from "./comptaPortal.mapper";
import type { ComptaDashboardData, ComptaMeResponse } from "./comptaPortal.types";

export const comptaPortalService = {
  me: async (): Promise<ComptaMeResponse> => {
    const response = await apiClient.get<unknown>(LINKS.compta.v1.me);
    return mapComptaMe(response);
  },

  dashboard: async (): Promise<ComptaDashboardData> => {
    const response = await apiClient.get<unknown>(LINKS.compta.v1.dashboard);
    return mapComptaDashboard(response);
  },
};
