"use client";

import { useQuery } from "@tanstack/react-query";
import { franchiseDashboardService } from "./dashboard.service";

export const franchiseDashboardKeys = {
  all: ["franchise", "dashboard"] as const,
};

export function useFranchiseDashboard() {
  return useQuery({
    queryKey: franchiseDashboardKeys.all,
    queryFn: () => franchiseDashboardService.get(),
  });
}
