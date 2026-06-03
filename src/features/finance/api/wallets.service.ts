import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";

export interface PlatformWallet {
  id: string;
  owner_type: "driver" | "partner" | "franchise";
  owner_id: number;
  owner_name: string;
  franchise_name: string;
  balance_fcfa: number;
  pending_fcfa: number;
  status: "active" | "frozen";
}

export const walletsService = {
  list: () => apiClient.get<Paginated<PlatformWallet>>("/admin/finance/wallets"),
};
