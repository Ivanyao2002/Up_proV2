/** GET /v1/drivers/{id}/wallet */

export interface ApiDriverWalletResponse {
  status?: string;
  wallet?: {
    id?: string;
    balanceCachedXof?: number;
    balance_fcfa?: number;
    availableXof?: number;
    available_xof?: number;
    withdrawableBalanceXof?: number;
    withdrawable_balance_xof?: number;
    nonWithdrawableBalanceXof?: number;
    non_withdrawable_balance_xof?: number;
    pendingWithdrawalXof?: number;
    pending_withdrawal_xof?: number;
    currency?: string;
    status?: string;
  } | null;
}

/** GET /v1/drivers/{id}/ledger */

export interface ApiDriverLedgerItem {
  id: string;
  entry_type?: string;
  type?: string;
  label?: string;
  description?: string;
  direction?: string;
  amount_xof?: number;
  amount_fcfa?: number;
  amountXof?: number;
  balance_after_xof?: number;
  balance_after_fcfa?: number;
  balanceAfterXof?: number;
  created_at?: string;
  posted_at?: string;
}

export interface ApiDriverLedgerResponse {
  status?: string;
  items?: ApiDriverLedgerItem[];
  transactions?: ApiDriverLedgerItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
