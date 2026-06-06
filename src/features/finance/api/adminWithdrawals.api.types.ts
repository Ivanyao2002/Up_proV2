import type { ApiV1Pagination } from "@/core/api/v1Pagination";

/** GET /v1/admin/withdrawals */

export interface ApiAdminWithdrawalItem {
  id: string;
  wallet_id?: string;
  requested_by?: string;
  amount_xof?: number;
  amountXof?: number;
  provider?: string;
  destination_type?: string;
  destination_identifier?: string;
  status?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
  beneficiaryName?: string | null;
  ownerName?: string | null;
  ownerId?: string | null;
  franchiseName?: string | null;
  franchiseId?: string | null;
  franchise_id?: string | null;
  method?: string | null;
  walletBalanceXof?: number | null;
}

export interface ApiAdminWithdrawalsSummary {
  pendingCount?: number;
  pendingAmountXof?: number;
}

export interface ApiAdminWithdrawalsResponse {
  status: string;
  generatedAt?: string;
  items?: ApiAdminWithdrawalItem[];
  summary?: ApiAdminWithdrawalsSummary;
  pagination?: ApiV1Pagination;
}
