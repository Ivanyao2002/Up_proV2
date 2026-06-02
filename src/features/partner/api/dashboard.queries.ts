"use client";

import { useQuery } from "@tanstack/react-query";
import { partnerDashboardService } from "./dashboard.service";

export const partnerDashboardKeys = {
  all: ["partner", "dashboard"] as const,
};

export function usePartnerDashboard() {
  return useQuery({
    queryKey: partnerDashboardKeys.all,
    queryFn: () => partnerDashboardService.get(),
  });
}
