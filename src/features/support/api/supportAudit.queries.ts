"use client";

import { useQuery } from "@tanstack/react-query";
import {
  supportAuditService,
  type SupportAuditListParams,
} from "./supportAudit.service";

export function useSupportAuditLog(params?: SupportAuditListParams) {
  return useQuery({
    queryKey: ["support", "audit-log", params],
    queryFn: () => supportAuditService.list(params),
  });
}

export function useSupportDashboardStats() {
  return useQuery({
    queryKey: ["support", "dashboard", "stats"],
    queryFn: () => supportAuditService.dashboardStats(),
    staleTime: 60_000,
  });
}

export function useSupportDashboardRecent() {
  return useQuery({
    queryKey: ["support", "dashboard", "recent"],
    queryFn: () => supportAuditService.dashboardRecent(),
    staleTime: 60_000,
  });
}
