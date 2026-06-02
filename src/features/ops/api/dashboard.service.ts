import { apiClient } from "@/core/http/apiClient";
import type { DashboardAdminKpi } from "@/shared/types";

export const dashboardService = {
  getAdmin: () => apiClient.get<DashboardAdminKpi>("/admin/dashboard"),
};
