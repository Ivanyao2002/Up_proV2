import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { Paginated } from "@/shared/types";
import type {
  SupportAuditAction,
  SupportAuditCategory,
  SupportAuditEvent,
  SupportAuditSeverity,
  SupportDashboardStats,
  SupportDashboardRecent,
} from "./supportAudit.types";

export interface SupportAuditListParams
  extends Omit<ListParams, "type" | "category" | "severity"> {
  action?: SupportAuditAction;
  severity?: SupportAuditSeverity;
  resource_type?: "ticket";
  /** Catégorie d'audit (ticket, compensation, sanction…) — envoyée comme ?category=. */
  category?: SupportAuditCategory | "all";
}

export const supportAuditService = {
  list: (params?: SupportAuditListParams): Promise<Paginated<SupportAuditEvent>> => {
    const { action, resource_type, category, ...commonParams } = params ?? {};
    const commonQuery = buildListQuery(commonParams);
    const query = new URLSearchParams(
      commonQuery.startsWith("?") ? commonQuery.slice(1) : commonQuery
    );
    if (action) query.set("action", action);
    if (resource_type) query.set("resource_type", resource_type);
    if (category && category !== "all") query.set("category", category);
    const suffix = query.size ? `?${query.toString()}` : "";
    return apiClient.get(`${LINKS.support.auditLog}${suffix}`);
  },

  dashboardStats: (): Promise<SupportDashboardStats> =>
    apiClient.get(LINKS.support.dashboard.stats),

  dashboardRecent: (): Promise<SupportDashboardRecent> =>
    apiClient.get(LINKS.support.dashboard.recent),
};
