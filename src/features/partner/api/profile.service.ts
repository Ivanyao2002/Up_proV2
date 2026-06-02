import { apiClient } from "@/core/http/apiClient";
import type { PartnerProfile } from "@/shared/types";

export const partnerProfileService = {
  get: () => apiClient.get<PartnerProfile>("/partner/profile"),
  update: (data: Partial<PartnerProfile>) =>
    apiClient.patch<PartnerProfile>("/partner/profile", data),
};
