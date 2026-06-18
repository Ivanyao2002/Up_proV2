import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
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
  getStats: async (): Promise<PlatformDriverRechargeStats> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<PlatformDriverRechargeStats>(
        "/admin/finance/driver-transfers/stats"
      );
    }

    const response = await apiClient.get<ApiFinanceDriverTransferStatsResponse>(
      LINKS.admin.v1.finance.driverTransferStats
    );
    return mapFinanceDriverTransferStats(response);
  },

  list: async (params?: ListParams): Promise<Paginated<PlatformDriverTransfer>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<PlatformDriverTransfer>>(
        `/admin/finance/driver-transfers${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiFinanceListResponse<ApiFinanceDriverTransferItem>
    >(`${LINKS.admin.v1.finance.driverTransfers}${buildV1ListQuery(params)}`);

    return mapFinanceListResponse(response, params, mapFinanceDriverTransferItem);
  },
};
