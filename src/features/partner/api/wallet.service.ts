import { apiClient } from "@/core/http/apiClient";
import type { PartnerWallet } from "@/shared/types";

export const partnerWalletService = {
  get: () => apiClient.get<PartnerWallet>("/partner/wallet"),

  withdraw: (amount_fcfa: number) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      withdrawal_id: string;
      wallet: PartnerWallet;
    }>("/partner/wallet/withdraw", { amount_fcfa }),
};
