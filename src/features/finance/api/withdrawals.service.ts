import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import type { WithdrawalsResponse } from "@/shared/types";

export const withdrawalsService = {
  listAdmin: () =>
    apiClient.get<WithdrawalsResponse>("/admin/finance/withdrawals"),

  approve: (id: string) =>
    apiWithNotify.post(
      `/admin/finance/withdrawals/${id}/approve`,
      undefined,
      "Retrait approuvé"
    ),

  reject: (id: string) =>
    apiWithNotify.post(
      `/admin/finance/withdrawals/${id}/reject`,
      undefined,
      "Retrait rejeté"
    ),
};
