import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { ApiAdminOrdersFilterOptions } from "@/features/ops/api/adminOrders.api.types";

export interface ApiFinanceListResponse<T> {
  status?: string;
  generatedAt?: string;
  items?: T[];
  /** Alias API commissions */
  commissions?: T[];
  pagination?: ApiV1Pagination;
  summary?: Record<string, unknown>;
  filterOptions?: ApiAdminOrdersFilterOptions;
  filter_options?: ApiAdminOrdersFilterOptions;
}

export interface ApiFinanceDashboardResponse {
  status?: string;
  generatedAt?: string;
  summary?: {
    gmv_month_fcfa?: number;
    commissions_month_fcfa?: number;
    volume_today_fcfa?: number;
    credits_today_fcfa?: number;
    debits_today_fcfa?: number;
    wallets_total_fcfa?: number;
    withdrawals_pending?: number;
    currency?: string;
  };
  chart_weekly?: Array<{
    day?: string;
    gmv?: number;
    commissions?: number;
    payouts?: number;
  }>;
  by_franchise?: Array<{
    franchise_id?: string;
    franchise_name?: string;
    city?: string;
    gross_fcfa?: number;
    commission_fcfa?: number;
    gmv_month_fcfa?: number;
    margin_fcfa?: number;
    share_pct?: number;
  }>;
  payment_mix?: Array<{
    method?: string;
    label?: string;
    amount_fcfa?: number;
    share_pct?: number;
  }>;
  alerts?: Array<{
    id?: string;
    level?: string;
    label?: string;
    title?: string;
    description?: string;
    count?: number;
    href?: string;
  }>;
  franchise_options?: Array<{
    id?: string;
    name?: string;
    city?: string;
  }>;
  recent_movements?: Array<{
    id?: string;
    label?: string;
    description?: string;
    amount_xof?: number;
    amount_fcfa?: number;
    direction?: string;
    entry_type?: string;
    type?: string;
    created_at?: string;
    posted_at?: string;
  }>;
}

export interface ApiFinanceTransactionItem {
  id: string;
  entry_type?: string;
  type?: string;
  label?: string;
  description?: string;
  entity_type?: string;
  entity_ref?: string;
  amount_fcfa?: number;
  amount_xof?: number;
  amountXof?: number;
  direction?: string;
  status?: string;
  payment_method?: string;
  franchise_id?: string | null;
  franchise_name?: string | null;
  partner_id?: string | null;
  partner_name?: string | null;
  owner_name?: string | null;
  franchise?: { id?: string; name?: string | null } | null;
  partner?: { id?: string; tradeName?: string | null; name?: string | null } | null;
  wallet?: {
    id?: string;
    ownerType?: string;
    owner?: { id?: string; displayName?: string | null; driverCode?: string | null };
  } | null;
  order?: {
    id?: string;
    ref?: string;
    serviceType?: string;
  } | null;
  commissionBreakdown?: {
    grossAmountXof?: number;
    driverAmountXof?: number;
    partnerAmountXof?: number;
    platformAmountXof?: number;
    fiscalityAmountXof?: number;
    franchiseAmountXof?: number;
  } | null;
  created_at?: string;
  createdAt?: string;
  posted_at?: string;
}

export interface ApiFinanceTransactionDetailResponse {
  status?: string;
  transaction?: ApiFinanceTransactionItem;
}

export interface ApiFinanceWalletItem {
  id: string;
  owner_type?: string;
  owner_id?: string;
  owner_name?: string;
  franchise_name?: string | null;
  balance_fcfa?: number;
  balance_cached_xof?: number;
  withdrawable_fcfa?: number;
  withdrawable_balance_xof?: number;
  non_withdrawable_fcfa?: number;
  non_withdrawable_balance_xof?: number;
  pending_fcfa?: number;
  available_fcfa?: number;
  status?: string;
}

export interface ApiFinanceCommissionItem {
  id: string;
  period_label?: string;
  franchise_id?: string | null;
  franchise_name?: string | null;
  trips_count?: number;
  gross_fcfa?: number;
  gross_amount_xof?: number;
  commission_fcfa?: number;
  platform_amount_xof?: number;
  franchise_amount_xof?: number;
  partner_amount_xof?: number;
  fiscality_amount_xof?: number;
  rate_pct?: number;
  status?: string;
  service_type?: string;
  order_id?: string;
  created_at?: string;
}

export interface ApiFinanceReconciliationItem {
  id: string;
  period_start?: string;
  period_end?: string;
  source?: string;
  expected_fcfa?: number;
  expected_amount_xof?: number;
  received_fcfa?: number;
  declared_amount_xof?: number;
  delta_fcfa?: number;
  difference_xof?: number;
  status?: string;
}

export interface ApiFinanceDriverTransferItem {
  id: string;
  owner_name?: string;
  driver_name?: string;
  amount_fcfa?: number;
  amount_xof?: number;
  provider?: string;
  source?: string;
  status?: string;
  created_at?: string;
}

export interface ApiFinanceDriverTransferStatsResponse {
  status?: string;
  total_count?: number;
  total_amount_fcfa?: number;
  pending_count?: number;
  completed_count?: number;
}
