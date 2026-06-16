/** GET /v1/partners/{id}/wallet · GET /v1/partners/{id}/ledger */

export interface ApiV1PartnerWalletItem {
  id: string;
  owner_type?: string | null;
  owner_id?: string | null;
  currency?: string | null;
  status?: string | null;
  balance_cached_xof?: number | null;
  withdrawable_balance_xof?: number | null;
  withdrawable_xof?: number | null;
  non_withdrawable_balance_xof?: number | null;
  non_withdrawable_xof?: number | null;
  pending_withdrawal_xof?: number | null;
  available_xof?: number | null;
  last_calculated_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiV1PartnerWalletResponse {
  status?: string;
  generatedAt?: string;
  wallet?: ApiV1PartnerWalletItem;
}

export interface ApiV1PartnerLedgerItem {
  id: string;
  wallet_id?: string | null;
  entry_type?: string | null;
  direction?: "credit" | "debit" | string | null;
  amount_xof?: number | null;
  currency?: string | null;
  status?: string | null;
  description?: string | null;
  posted_at?: string | null;
  created_at?: string | null;
}

export interface ApiV1PartnerLedgerResponse {
  status?: string;
  generatedAt?: string;
  items?: ApiV1PartnerLedgerItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}
