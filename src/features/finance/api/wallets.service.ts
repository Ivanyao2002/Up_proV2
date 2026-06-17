import { apiClient } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ComptaApiScope } from "@/features/compta/api/comptaApiScope";
import { comptaFinanceLinks } from "@/features/compta/api/comptaApiScope";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiFinanceListResponse, ApiFinanceWalletItem } from "./adminFinance.api.types";
import { mapFinanceListResponse, mapFinanceWalletItem } from "./adminFinance.mapper";

export interface PlatformWallet {
  id: string;
  owner_type: "driver" | "partner" | "franchise";
  owner_id: number;
  owner_name: string;
  franchise_name: string;
  balance_fcfa: number;
  withdrawable_fcfa?: number;
  non_withdrawable_fcfa?: number;
  pending_fcfa: number;
  status: "active" | "frozen";
}

export const walletsService = {
  list: async (
    params?: ListParams,
    scope: ComptaApiScope = "admin"
  ): Promise<Paginated<PlatformWallet>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<PlatformWallet>>(
        `/admin/finance/wallets${buildListQuery(params)}`
      );
    }

    const links = comptaFinanceLinks(scope);
    const response = await apiClient.get<ApiFinanceListResponse<ApiFinanceWalletItem>>(
      `${links.wallets}${buildV1ListQuery(params)}`
    );

    return mapFinanceListResponse(response, params, mapFinanceWalletItem);
  },
};
