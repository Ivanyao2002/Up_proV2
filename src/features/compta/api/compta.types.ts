import type { Paginated } from "@/shared/types";
import type { TripsScopeFilterOptions } from "@/shared/types";

export type LedgerDirection = "debit" | "credit";
export type LedgerBalanceBucket = "WITHDRAWABLE" | "NON_WITHDRAWABLE" | string;

export interface LedgerBreakdownItem {
  label: string;
  value: string;
  /** Montant financier — affiché en tabular-nums */
  isAmount?: boolean;
}

export interface LedgerEntry {
  id: string;
  txn_id?: string;
  entry_type: string;
  direction: LedgerDirection;
  amount_xof: number;
  balance_bucket?: LedgerBalanceBucket;
  wallet_id?: string;
  owner_name?: string;
  franchise_name?: string;
  source_type?: string;
  source_id?: string;
  order_id?: string;
  order_ref?: string;
  service_type?: string;
  status: string;
  description?: string;
  metadata?: Record<string, unknown>;
  posted_at: string;
}

export interface LedgerListResponse extends Paginated<LedgerEntry> {
  summary?: {
    credits_xof?: number;
    debits_xof?: number;
    net_xof?: number;
  };
  filter_options?: TripsScopeFilterOptions;
}

export interface LedgerFlowRow {
  entry_type: string;
  label: string;
  credits_xof: number;
  debits_xof: number;
  net_xof: number;
  lines_count: number;
}

export interface AccountingPeriod {
  id: string;
  label: string;
  period_type?: string;
  status: string;
  period_start?: string;
  period_end?: string;
  closed_at?: string;
  locked_at?: string;
}

export interface AccountingPeriodsResponse {
  data: AccountingPeriod[];
}

export interface CashReconciliationRow {
  id: string;
  date_label: string;
  driver_name: string;
  franchise_name?: string;
  expected_fcfa: number;
  received_fcfa: number;
  delta_fcfa: number;
  status: "matched" | "discrepancy" | "pending";
}
