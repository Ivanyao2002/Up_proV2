import { apiClient } from "@/core/http/apiClient";
import type { TransactionsResponse } from "@/shared/types";

export const transactionsService = {
  listAdmin: () =>
    apiClient.get<TransactionsResponse>("/admin/finance/transactions"),
};
