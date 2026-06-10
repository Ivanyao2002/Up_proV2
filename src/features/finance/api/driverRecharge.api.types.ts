import type { ApiV1Pagination } from "@/core/api/v1Pagination";

/** POST …/wallet/driver-recharge · POST …/finance/driver-recharge */
export interface ApiDriverRechargeBody {
  driver_id: string;
  amount_fcfa: number;
  note?: string;
}

export interface ApiDriverTransferItem {
  id: string;
  ref?: string | null;
  driver_id?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  amount_fcfa?: number | null;
  amount_xof?: number | null;
  status?: string | null;
  note?: string | null;
  mobile_wallet_credited?: boolean | null;
  created_at?: string | null;
}

export interface ApiDriverTransferStatsResponse {
  status?: string;
  totalTransfers?: number;
  totalAmountXof?: number;
  total_spent_fcfa?: number;
  transfers_count?: number;
  month_spent_fcfa?: number;
  month_transfers_count?: number;
  last_transfer_at?: string | null;
  recentTransfers?: ApiDriverTransferItem[];
}

export interface ApiDriverTransferListResponse {
  status?: string;
  items?: ApiDriverTransferItem[];
  transfers?: ApiDriverTransferItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiDriverRechargeResponse {
  status?: string;
  ok?: boolean;
  message?: string;
  transfer?: ApiDriverTransferItem;
  wallet?: Record<string, unknown>;
  stats?: ApiDriverTransferStatsResponse;
  finance?: Record<string, unknown>;
}
