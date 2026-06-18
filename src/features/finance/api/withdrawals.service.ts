import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchFranchiseNameMap } from "@/features/admin/api/adminFilterOptions.service";
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
  listAdmin: async (params?: ListParams): Promise<WithdrawalsResponse> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<WithdrawalsResponse>(
        `/admin/finance/withdrawals${buildListQuery(params)}`
      );
    }

    const [response, franchiseMap] = await Promise.all([
      apiClient.get<ApiAdminWithdrawalsResponse>(
        `${LINKS.admin.v1.withdrawals}${buildV1ListQuery(params)}`
      ),
      fetchFranchiseNameMap(),
    ]);

    return mapAdminWithdrawalsToResponse(
      response,
      params,
      response.pagination,
      franchiseMap
    );
  },

  getById: async (id: string): Promise<WithdrawalDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<WithdrawalDetail>(
        `/admin/finance/withdrawals/${id}`
      );
    }

    const [response, franchiseMap] = await Promise.all([
      apiClient.get<ApiAdminWithdrawalDetailResponse>(
        LINKS.admin.v1.withdrawalById(id)
      ),
      fetchFranchiseNameMap(),
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
