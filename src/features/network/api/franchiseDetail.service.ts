import { apiClient } from "@/core/http/apiClient";
import type { FranchiseDetail } from "@/shared/types";

export const franchiseDetailService = {
  getById: (id: string | number) =>
    apiClient.get<FranchiseDetail>(`/admin/network/franchises/${id}`),
};
