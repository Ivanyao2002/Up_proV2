import { apiClient } from "@/core/http/apiClient";
import type { DashboardPartnerKpi } from "@/shared/types";

export const partnerDashboardService = {
  get: () => apiClient.get<DashboardPartnerKpi>("/partner/dashboard"),
};
