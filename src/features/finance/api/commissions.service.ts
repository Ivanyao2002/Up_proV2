import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchScopeFilterOptions } from "@/features/admin/api/adminFilterOptions.service";
import type { ComptaApiScope } from "@/features/compta/api/comptaApiScope";
import { comptaFinanceLinks } from "@/features/compta/api/comptaApiScope";
import { mapOrdersFilterOptions } from "@/features/ops/api/adminOrders.mapper";
import type { LiveMapData, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiFinanceCommissionItem,
  ApiFinanceListResponse,
  ApiFinanceReconciliationItem,
} from "./adminFinance.api.types";
import {
  mapCommissionStatusQuery,
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

function commissionsEndpoint(scope: ComptaApiScope = "admin"): string {
  return scope === "portal"
    ? comptaFinanceLinks("portal").commissions
    : LINKS.admin.v1.finance.commissions;
}

function resolveCommissionListParams(params?: ListParams): ListParams | undefined {
  if (!params?.status) return params;
  const status = mapCommissionStatusQuery(params.status);
  return { ...params, status: status ?? params.status };
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

    const listParams = resolveCommissionListParams(params);
    const response = await apiClient.get<
      ApiFinanceListResponse<ApiFinanceCommissionItem>
    >(`${commissionsEndpoint(scope)}${buildV1ListQuery(listParams)}`);

    let filterOptions = mapOrdersFilterOptions(
      response.filterOptions ?? response.filter_options
    );

    if (!filterOptions.franchises.length) {
      try {
        filterOptions = await fetchScopeFilterOptions(scope);
      } catch {
        // Les commissions peuvent s'afficher sans filter-options global.
      }
    }

    return mapFinanceCommissionsResponse(response, listParams, filterOptions);
  },
};

export const reconciliationService = {
  list: async (params?: ListParams): Promise<Paginated<ReconciliationRow>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<ReconciliationRow>>(
        `/admin/finance/reconciliation${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiFinanceListResponse<ApiFinanceReconciliationItem> & {
        reconciliations?: ApiFinanceReconciliationItem[];
      }
    >(`${LINKS.admin.v1.finance.reconciliation}${buildV1ListQuery(params)}`);

    const items = response.items ?? response.reconciliations ?? [];
    return mapFinanceListResponse(
      { ...response, items },
      params,
      mapFinanceReconciliationItem
    );
  },
};
