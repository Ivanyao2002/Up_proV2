import { apiClient } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ComptaApiScope } from "@/features/compta/api/comptaApiScope";
import { comptaFinanceLinks } from "@/features/compta/api/comptaApiScope";
import type {
  Paginated,
  PlatformDriverRechargeStats,
  PlatformDriverTransfer,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiFinanceDriverTransferStatsResponse,
  ApiFinanceListResponse,
  ApiFinanceDriverTransferItem,
} from "./adminFinance.api.types";
import {
  mapFinanceDriverTransferItem,
  mapFinanceDriverTransferStats,
  mapFinanceListResponse,
} from "./adminFinance.mapper";

export const adminDriverTransfersService = {
  getStats: async (scope: ComptaApiScope = "admin"): Promise<PlatformDriverRechargeStats> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<PlatformDriverRechargeStats>(
        "/admin/finance/driver-transfers/stats"
      );
    }

    const links = comptaFinanceLinks(scope);
    const response = await apiClient.get<ApiFinanceDriverTransferStatsResponse>(
      links.driverTransferStats
    );
    return mapFinanceDriverTransferStats(response);
  },

  list: async (
    params?: ListParams,
    scope: ComptaApiScope = "admin"
  ): Promise<Paginated<PlatformDriverTransfer>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<PlatformDriverTransfer>>(
        `/admin/finance/driver-transfers${buildListQuery(params)}`
      );
    }

    const links = comptaFinanceLinks(scope);
    const response = await apiClient.get<
      ApiFinanceListResponse<ApiFinanceDriverTransferItem>
    >(`${links.driverTransfers}${buildV1ListQuery(params)}`);

    return mapFinanceListResponse(response, params, mapFinanceDriverTransferItem);
  },
};
