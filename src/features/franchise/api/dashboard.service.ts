import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { mapFranchiseDashboard } from "./franchiseDashboard.mapper";

export interface FranchiseDashboard {
  territory_name: string;
  partners_count: number;
  drivers_total: number;
  drivers_online: number;
  trips_today: number;
  trips_today_trend_pct: number;
  trips_completed_today: number;
  revenue_today_fcfa: number;
  revenue_trend_pct: number;
  pending_kyc: number;
  pending_withdrawals: {
    total_fcfa: number;
    partners_fcfa: number;
    partners_requests_count: number;
    drivers_fcfa: number;
    drivers_requests_count: number;
  };
  chart_flux: { day: string; revenue: number; trips: number }[];
  recent_partners: {
    id: string;
    name: string;
    drivers_count: number;
    status: "active" | "pending" | "suspended";
  }[];
}

async function fetchDashboardV1(): Promise<FranchiseDashboard> {
  const franchiseId = await resolveFranchiseId();
  const [dash, partners] = await Promise.all([
    apiClient.get<unknown>(LINKS.franchise.v1.dashboard),
    apiClient.get<ApiV1FranchisePartnersResponse>(
      appendQuery(LINKS.franchise.v1.partners(franchiseId), buildV1ListQuery({ page: 1, per_page: 5 }))
    ),
  ]);

  return mapFranchiseDashboard(dash, partners);
}

export const franchiseDashboardService = {
  get: () =>
    useLegacyPortalApi()
      ? apiClient.get<FranchiseDashboard>(LINKS.franchise.dashboard)
      : fetchDashboardV1(),
};
