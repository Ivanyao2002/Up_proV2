import { apiClient } from "@/core/http/apiClient";
import type { PartnerWallet } from "@/shared/types";

export const partnerWalletService = {
  get: () => apiClient.get<PartnerWallet>("/partner/wallet"),
};
