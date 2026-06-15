import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { LiveMapData, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchisePartnerCommission {
  id: string;
  partner_id: number;
  partner_name: string;
  partner_city: string;
  period_label: string;
  trips_count: number;
  gross_fcfa: number;
  commission_fcfa: number;
  rate_pct: number;
  status: "pending" | "paid";
}

export interface FranchiseCommissionsSummary {
  pending_fcfa: number;
  pending_count: number;
  paid_month_fcfa: number;
}

export interface FranchiseCommissionsListResponse extends Paginated<FranchisePartnerCommission> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
  summary: FranchiseCommissionsSummary;
}

export const franchiseCommissionsService = {
  list: (params?: ListParams & { partner_id?: number | string }) =>
    useLegacyPortalApi()
      ? apiClient.get<FranchiseCommissionsListResponse>(
          `/franchise/finance/commissions${buildListQuery(params)}`
        )
      : apiClient.get<FranchiseCommissionsListResponse>(
          appendQuery(LINKS.franchise.v1.commissions, buildV1ListQuery(params))
        ),
};
