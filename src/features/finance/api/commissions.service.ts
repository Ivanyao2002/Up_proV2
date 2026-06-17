import { apiClient } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchScopeFilterOptions } from "@/features/admin/api/adminFilterOptions.service";
import type { ComptaApiScope } from "@/features/compta/api/comptaApiScope";
import { comptaFinanceLinks } from "@/features/compta/api/comptaApiScope";
import type { LiveMapData, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiFinanceCommissionItem,
  ApiFinanceListResponse,
  ApiFinanceReconciliationItem,
} from "./adminFinance.api.types";
import {
  mapFinanceCommissionsResponse,
  mapFinanceListResponse,
  mapFinanceReconciliationItem,
} from "./adminFinance.mapper";

export interface CommissionRow {
  id: string;
  period_label: string;
  franchise_id: number;
  franchise_name: string;
  trips_count: number;
  gross_fcfa: number;
  commission_fcfa: number;
  rate_pct: number;
  status: "pending" | "paid";
}

export interface CommissionsListResponse extends Paginated<CommissionRow> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
}

export interface ReconciliationRow {
  id: string;
  date_label: string;
  source: string;
  expected_fcfa: number;
  received_fcfa: number;
  delta_fcfa: number;
  status: "matched" | "discrepancy" | "pending";
}

export const commissionsService = {
  list: async (
    params?: ListParams,
    scope: ComptaApiScope = "admin"
  ): Promise<CommissionsListResponse> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<CommissionsListResponse>(
        `/admin/finance/commissions${buildListQuery(params)}`
      );
    }

    const links = comptaFinanceLinks(scope);
    const [response, filterOptions] = await Promise.all([
      apiClient.get<ApiFinanceListResponse<ApiFinanceCommissionItem>>(
        `${links.commissions}${buildV1ListQuery(params)}`
      ),
      fetchScopeFilterOptions(scope),
    ]);

    return mapFinanceCommissionsResponse(response, params, filterOptions);
  },
};

export const reconciliationService = {
  list: async (
    params?: ListParams,
    scope: ComptaApiScope = "admin"
  ): Promise<Paginated<ReconciliationRow>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<ReconciliationRow>>(
        `/admin/finance/reconciliation${buildListQuery(params)}`
      );
    }

    const links = comptaFinanceLinks(scope);
    const response = await apiClient.get<
      ApiFinanceListResponse<ApiFinanceReconciliationItem> & {
        reconciliations?: ApiFinanceReconciliationItem[];
      }
    >(`${links.reconciliation}${buildV1ListQuery(params)}`);

    const items = response.items ?? response.reconciliations ?? [];
    return mapFinanceListResponse(
      { ...response, items },
      params,
      mapFinanceReconciliationItem
    );
  },
};
