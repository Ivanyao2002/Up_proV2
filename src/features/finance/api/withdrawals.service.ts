import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchFranchiseNameMap } from "@/features/admin/api/adminFilterOptions.service";
import type { ComptaApiScope } from "@/features/compta/api/comptaApiScope";
import { comptaFinanceLinks } from "@/features/compta/api/comptaApiScope";
import type { WithdrawalsResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiAdminWithdrawalDetailResponse,
  ApiAdminWithdrawalsResponse,
} from "./adminWithdrawals.api.types";
import {
  mapAdminWithdrawalDetail,
  mapAdminWithdrawalsToResponse,
  type WithdrawalDetail,
} from "./adminWithdrawals.mapper";

export const withdrawalsService = {
  list: async (
    scope: ComptaApiScope = "admin",
    params?: ListParams
  ): Promise<WithdrawalsResponse> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<WithdrawalsResponse>(
        `/admin/finance/withdrawals${buildListQuery(params)}`
      );
    }

    const links = comptaFinanceLinks(scope);
    const [response, franchiseMap] = await Promise.all([
      apiClient.get<ApiAdminWithdrawalsResponse>(
        `${links.withdrawals}${buildV1ListQuery(params)}`
      ),
      fetchFranchiseNameMap(scope),
    ]);

    return mapAdminWithdrawalsToResponse(
      response,
      params,
      response.pagination,
      franchiseMap
    );
  },

  /** @deprecated Préférer `list(scope, params)` */
  listAdmin: async (params?: ListParams) => withdrawalsService.list("admin", params),

  getById: async (scope: ComptaApiScope, id: string): Promise<WithdrawalDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<WithdrawalDetail>(
        `/admin/finance/withdrawals/${id}`
      );
    }

    const links = comptaFinanceLinks(scope);
    const [response, franchiseMap] = await Promise.all([
      apiClient.get<ApiAdminWithdrawalDetailResponse>(links.withdrawalById(id)),
      fetchFranchiseNameMap(scope),
    ]);

    if (!response.withdrawal?.id) {
      throw new Error("WITHDRAWAL_NOT_FOUND");
    }

    return mapAdminWithdrawalDetail(response.withdrawal, franchiseMap);
  },

  approve: (id: string) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        `/admin/finance/withdrawals/${id}/approve`,
        undefined,
        "Retrait approuvé"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.withdrawalApprove(id),
      undefined,
      "Retrait approuvé"
    );
  },

  reject: (id: string) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        `/admin/finance/withdrawals/${id}/reject`,
        undefined,
        "Retrait rejeté"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.withdrawalReject(id),
      undefined,
      "Retrait rejeté"
    );
  },
};
