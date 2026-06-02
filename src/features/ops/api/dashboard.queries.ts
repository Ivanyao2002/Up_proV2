"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./dashboard.keys";
import { dashboardService } from "./dashboard.service";

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: () => dashboardService.getAdmin(),
  });
}
