import { apiClient } from "@/core/http/apiClient";
import type { PartnerDetail } from "@/shared/types";

export const partnerDetailService = {
  getById: (id: string | number) =>
    apiClient.get<PartnerDetail>(`/admin/network/partners/${id}`),
};
