import { apiClient } from "@/core/http/apiClient";
import type { KycQueueItem, Paginated } from "@/shared/types";

export const kycService = {
  getQueue: () => apiClient.get<Paginated<KycQueueItem>>("/admin/fleet/kyc"),
};
