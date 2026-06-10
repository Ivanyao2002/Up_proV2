import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type {
  AdminFinanceDashboard,
  FinanceAlertSeverity,
  Paginated,
  PlatformDriverRechargeStats,
  PlatformDriverTransfer,
  Transaction,
  TransactionsResponse,
} from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { TripsScopeFilterOptions } from "@/shared/types";
import { buildAdminDriverDetailPath } from "@/features/fleet/lib/driverRoutes";
import type {
  ApiFinanceCommissionItem,
  ApiFinanceDashboardResponse,
  ApiFinanceDriverTransferItem,
  ApiFinanceDriverTransferStatsResponse,
  ApiFinanceListResponse,
  ApiFinanceReconciliationItem,
  ApiFinanceTransactionItem,
  ApiFinanceWalletItem,
} from "./adminFinance.api.types";
import type { CommissionRow, ReconciliationRow } from "./commissions.service";
import type { PlatformWallet } from "./wallets.service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ignore libellés où l’API renvoie l’UUID à la place du nom (FN-TRANS-LABELS-01). */
function resolveEntityDisplayName(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value || UUID_RE.test(value)) continue;
    return value;
  }
  return undefined;
}

function mapFinanceAlertSeverity(level?: string | null): FinanceAlertSeverity {
  const key = String(level ?? "info").toLowerCase();
  if (key === "critical" || key === "error") return "critical";
  if (key === "warning") return "warning";
  return "info";
}

function mapTransactionType(value?: string | null): Transaction["type"] {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("commission")) return "commission";
  if (key.includes("withdraw")) return "withdrawal";
  if (key.includes("refund")) return "refund";
  if (key.includes("payout")) return "payout";
  return "trip_payment";
}

function mapTransactionStatus(value?: string | null): Transaction["status"] {
  const key = String(value ?? "posted").toLowerCase();
  if (key === "failed" || key === "rejected") return "failed";
  if (key === "pending") return "pending";
  return "completed";
}

function mapWalletOwnerType(value?: string | null): PlatformWallet["owner_type"] {
  const key = String(value ?? "").toUpperCase();
  if (key === "PARTNER") return "partner";
  if (key === "FRANCHISE") return "franchise";
  return "driver";
}

function mapCommissionStatus(value?: string | null): CommissionRow["status"] {
  const key = String(value ?? "pending").toLowerCase();
  return key === "posted" || key === "paid" ? "paid" : "pending";
}

function mapReconciliationStatus(
  value?: string | null
): ReconciliationRow["status"] {
  const key = String(value ?? "pending").toLowerCase();
  if (key === "matched" || key === "approved") return "matched";
  if (key === "discrepancy" || key === "rejected") return "discrepancy";
  return "pending";
}

function mapTransferStatus(
  value?: string | null
): PlatformDriverTransfer["status"] {
  const key = String(value ?? "pending").toLowerCase();
  if (key === "completed" || key === "posted" || key === "success") return "completed";
  if (key === "failed" || key === "rejected") return "failed";
  return "pending";
}

function mapListResponse<TItem, TUi>(
  response: ApiFinanceListResponse<TItem>,
  params: ListParams | undefined,
  mapItem: (item: TItem) => TUi
): Paginated<TUi> {
  const mapped = (response.items ?? []).map(mapItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}

function mapFranchiseDashboardOption(
  item: NonNullable<ApiFinanceDashboardResponse["franchise_options"]>[number] &
    NonNullable<ApiFinanceDashboardResponse["by_franchise"]>[number]
) {
  const raw = item as {
    id?: string;
    franchise_id?: string;
    name?: string;
    franchise_name?: string;
    city?: string;
  };
  return {
    id: raw.id ?? raw.franchise_id ?? "",
    name: raw.name ?? raw.franchise_name ?? "—",
    city: raw.city ?? "—",
  };
}

export function mapFinanceDashboardResponse(
  response: ApiFinanceDashboardResponse,
  franchiseId?: string | null
): AdminFinanceDashboard {
  const summary = response.summary ?? {};
  const gmvMonth = summary.gmv_month_fcfa ?? 0;
  const commissionsMonth = summary.commissions_month_fcfa ?? 0;

  const franchiseOptionsSource = (
    response.franchise_options?.length
      ? response.franchise_options
      : response.by_franchise ?? []
  ) as Parameters<typeof mapFranchiseDashboardOption>[0][];

  return {
    selected_franchise_id: (franchiseId ?? null) as AdminFinanceDashboard["selected_franchise_id"],
    franchise_options: franchiseOptionsSource.map(mapFranchiseDashboardOption),
    gmv_today_fcfa: summary.volume_today_fcfa ?? 0,
    credits_today_fcfa: summary.credits_today_fcfa ?? 0,
    debits_today_fcfa: summary.debits_today_fcfa ?? 0,
    gmv_today_trend_pct: 0,
    gmv_month_fcfa: gmvMonth,
    gmv_month_trend_pct: 0,
    net_margin_month_fcfa: Math.max(0, gmvMonth - commissionsMonth),
    net_margin_trend_pct: 0,
    commissions_month_fcfa: commissionsMonth,
    commissions_trend_pct: 0,
    platform_treasury_fcfa: summary.wallets_total_fcfa ?? 0,
    withdrawals_pending_fcfa: 0,
    withdrawals_pending_count: summary.withdrawals_pending ?? 0,
    avg_trip_fcfa: 0,
    collection_rate_pct: 0,
    reconciliation_gap_fcfa: 0,
    reconciliation_items_open: 0,
    driver_wallets_total_fcfa: summary.wallets_total_fcfa ?? 0,
    partner_wallets_total_fcfa: 0,
    client_wallets_total_fcfa: 0,
    take_rate_pct: gmvMonth > 0 ? Math.round((commissionsMonth / gmvMonth) * 1000) / 10 : 0,
    chart_weekly: (response.chart_weekly ?? []).map((item) => ({
      day: item.day ?? "—",
      gmv: item.gmv ?? 0,
      commissions: item.commissions ?? 0,
      payouts: item.payouts ?? 0,
    })),
    by_franchise: (response.by_franchise ?? []).map((item) => ({
      franchise_id: item.franchise_id as unknown as number,
      franchise_name: item.franchise_name ?? "—",
      city: item.city ?? "—",
      gmv_month_fcfa: item.gmv_month_fcfa ?? item.gross_fcfa ?? 0,
      margin_fcfa: item.margin_fcfa ?? item.commission_fcfa ?? 0,
      share_pct: item.share_pct ?? 0,
    })),
    payment_mix: (response.payment_mix ?? []).map((item) => ({
      method: item.method ?? "—",
      label: item.label ?? item.method ?? "—",
      amount_fcfa: item.amount_fcfa ?? 0,
      share_pct: item.share_pct ?? 0,
    })),
    alerts: (response.alerts ?? []).map((item) => {
      const id = item.id ?? "alert";
      const defaultHref =
        id === "withdrawals_pending" ? "/admin/finance/withdrawals" : undefined;
      return {
        id,
        severity: mapFinanceAlertSeverity(item.level),
        title: item.title ?? item.label ?? "Alerte",
        description:
          item.description ??
          (item.count != null ? `${item.count} élément(s)` : ""),
        href: item.href ?? defaultHref,
      };
    }),
    recent_movements: (response.recent_movements ?? []).map((item) => ({
      id: item.id ?? "",
      label: item.label ?? item.description ?? "Mouvement",
      amount_fcfa: item.amount_fcfa ?? item.amount_xof ?? 0,
      direction: String(item.direction ?? "credit").toLowerCase() === "debit" ? "debit" : "credit",
      category: item.entry_type ?? item.type ?? "wallet",
      created_at: item.created_at ?? item.posted_at ?? new Date().toISOString(),
    })),
  };
}

function resolveFranchiseName(item: ApiFinanceTransactionItem): string {
  return (
    resolveEntityDisplayName(item.franchise_name, item.franchise?.name) ?? "—"
  );
}

function resolveTransactionDriverId(
  item: ApiFinanceTransactionItem
): string | undefined {
  const ownerId = item.wallet?.owner?.id?.trim();
  if (!ownerId) return undefined;

  const ownerType = String(item.wallet?.ownerType ?? "").toLowerCase();
  if (ownerType === "driver" || ownerType.includes("driver")) {
    return ownerId;
  }

  const entryType = String(item.entry_type ?? item.type ?? "").toLowerCase();
  if (entryType.includes("driver")) {
    return ownerId;
  }

  const entityType = String(item.entity_type ?? "").toLowerCase();
  if (entityType === "driver" || entityType.includes("driver")) {
    return ownerId;
  }

  return undefined;
}

export interface FinanceTransactionDetail extends Transaction {
  partner_name: string;
  owner_name: string;
  driver_id?: string;
  driver_detail_path?: string;
  wallet_owner_type?: string;
  order_id?: string;
  order_ref?: string;
  service_type?: string;
  commission_breakdown?: ApiFinanceTransactionItem["commissionBreakdown"];
}

export function mapFinanceTransactionDetail(
  item: ApiFinanceTransactionItem
): FinanceTransactionDetail {
  const base = mapFinanceTransactionItem(item);
  const driverId = resolveTransactionDriverId(item);
  return {
    ...base,
    partner_name:
      resolveEntityDisplayName(
        item.partner_name,
        item.partner?.tradeName,
        item.partner?.name
      ) ?? "—",
    owner_name:
      item.owner_name?.trim() ||
      item.wallet?.owner?.displayName?.trim() ||
      item.wallet?.owner?.driverCode?.trim() ||
      "—",
    driver_id: driverId,
    driver_detail_path: driverId
      ? buildAdminDriverDetailPath(driverId)
      : undefined,
    wallet_owner_type: item.wallet?.ownerType,
    order_id: item.order?.id,
    order_ref: item.order?.ref,
    service_type: item.order?.serviceType ?? undefined,
    commission_breakdown: item.commissionBreakdown ?? undefined,
  };
}

export function mapFinanceTransactionItem(item: ApiFinanceTransactionItem): Transaction {
  return {
    id: item.id,
    type: mapTransactionType(item.entry_type ?? item.type),
    label: item.label ?? item.description ?? "Transaction",
    entity_type: item.entity_type ?? "wallet",
    entity_ref: item.entity_ref ?? item.id,
    amount_fcfa: item.amount_fcfa ?? item.amount_xof ?? item.amountXof ?? 0,
    direction: String(item.direction ?? "credit").toLowerCase() === "debit" ? "debit" : "credit",
    status: mapTransactionStatus(item.status),
    payment_method: (item.payment_method as Transaction["payment_method"]) ?? "wallet",
    franchise_name: resolveFranchiseName(item),
    created_at: item.created_at ?? item.createdAt ?? item.posted_at ?? new Date().toISOString(),
  };
}

export function mapFinanceTransactionsResponse(
  response: ApiFinanceListResponse<ApiFinanceTransactionItem>,
  params?: ListParams
): TransactionsResponse {
  const page = mapListResponse(response, params, mapFinanceTransactionItem);
  const summary = response.summary ?? {};
  return {
    ...page,
    summary: {
      volume_today_fcfa: Number(summary.volume_today_fcfa ?? summary.volumeTodayFcfa ?? 0),
      credits_today_fcfa: Number(summary.credits_today_fcfa ?? summary.creditsTodayFcfa ?? 0),
      debits_today_fcfa: Number(summary.debits_today_fcfa ?? summary.debitsTodayFcfa ?? 0),
    },
  };
}

export function mapFinanceWalletItem(item: ApiFinanceWalletItem): PlatformWallet {
  return {
    id: item.id,
    owner_type: mapWalletOwnerType(item.owner_type),
    owner_id: item.owner_id as unknown as number,
    owner_name: item.owner_name ?? "—",
    franchise_name: item.franchise_name?.trim() || "—",
    balance_fcfa: item.balance_fcfa ?? item.balance_cached_xof ?? 0,
    pending_fcfa: item.pending_fcfa ?? 0,
    status: String(item.status ?? "active").toLowerCase() === "frozen" ? "frozen" : "active",
  };
}

export function mapFinanceCommissionItem(item: ApiFinanceCommissionItem): CommissionRow {
  return {
    id: item.id,
    period_label: item.period_label ?? "—",
    franchise_id: item.franchise_id as unknown as number,
    franchise_name: item.franchise_name?.trim() || "—",
    trips_count: item.trips_count ?? 0,
    gross_fcfa: item.gross_fcfa ?? item.gross_amount_xof ?? 0,
    commission_fcfa: item.commission_fcfa ?? item.platform_amount_xof ?? 0,
    rate_pct: item.rate_pct ?? 0,
    status: mapCommissionStatus(item.status),
  };
}

export function mapFinanceReconciliationItem(
  item: ApiFinanceReconciliationItem
): ReconciliationRow {
  const start = item.period_start ?? "";
  const end = item.period_end ?? "";
  return {
    id: item.id,
    date_label: start && end ? `${start} → ${end}` : start || end || "—",
    source: item.source ?? "cash_driver",
    expected_fcfa: item.expected_fcfa ?? item.expected_amount_xof ?? 0,
    received_fcfa: item.received_fcfa ?? item.declared_amount_xof ?? 0,
    delta_fcfa: item.delta_fcfa ?? item.difference_xof ?? 0,
    status: mapReconciliationStatus(item.status),
  };
}

export function mapFinanceDriverTransferItem(
  item: ApiFinanceDriverTransferItem
): PlatformDriverTransfer {
  const owner = item.owner_name ?? item.driver_name ?? "—";
  const provider = String(item.provider ?? item.source ?? "").toUpperCase();
  return {
    id: item.id,
    ref: item.id.slice(0, 8).toUpperCase(),
    driver_id: owner,
    driver_name: owner,
    driver_phone: "—",
    amount_fcfa: item.amount_fcfa ?? item.amount_xof ?? 0,
    status: mapTransferStatus(item.status),
    mobile_wallet_credited: mapTransferStatus(item.status) === "completed",
    created_at: item.created_at ?? new Date().toISOString(),
    owner_name: owner,
    source: provider.includes("FRANCHISE") ? "franchise" : "partner",
  };
}

export function mapFinanceDriverTransferStats(
  response: ApiFinanceDriverTransferStatsResponse
): PlatformDriverRechargeStats {
  return {
    total_spent_fcfa: response.total_amount_fcfa ?? 0,
    transfers_count: response.total_count ?? 0,
    month_spent_fcfa: response.total_amount_fcfa ?? 0,
    month_transfers_count: response.total_count ?? 0,
    partners_count: 0,
    franchises_count: 0,
  };
}

export function mapFinanceCommissionsResponse(
  response: ApiFinanceListResponse<ApiFinanceCommissionItem>,
  params: ListParams | undefined,
  filterOptions: TripsScopeFilterOptions
) {
  const page = mapListResponse(response, params, mapFinanceCommissionItem);
  return { ...page, filter_options: filterOptions };
}

export {
  mapListResponse as mapFinanceListResponse,
};
