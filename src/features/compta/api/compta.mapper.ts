import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiFinanceListResponse, ApiFinanceTransactionItem } from "@/features/finance/api/adminFinance.api.types";
import { mapOrdersFilterOptions } from "@/features/ops/api/adminOrders.mapper";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { LedgerEntry, LedgerListResponse } from "./compta.types";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  wallet_recharge: "Recharge wallet",
  partner_driver_recharge: "Recharge chauffeur (partenaire)",
  ride_commission: "Commission course",
  withdrawal: "Retrait",
  performance_bonus: "Bonus performance",
  service_credit: "Crédit service",
  welcome_bonus: "Bonus bienvenue",
  referral_bonus: "Parrainage",
  cancellation_fee: "Frais annulation",
  reversal: "Extourne",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  partner_driver_recharge: "Recharge chauffeur (partenaire)",
  order_commission_allocation: "Allocation commission course",
  wallet_recharge: "Recharge wallet",
  withdrawal: "Retrait",
  order: "Course",
  ride: "Course",
};

const LEDGER_STATUS_LABELS: Record<string, string> = {
  posted: "Comptabilisé",
  pending: "En attente",
  failed: "Échoué",
  rejected: "Rejeté",
  reversed: "Extourné",
};

function humanizeCode(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ledgerEntryTypeLabel(entryType?: string | null): string {
  const key = String(entryType ?? "").toLowerCase();
  if (!key) return "Écriture";
  return ENTRY_TYPE_LABELS[key] ?? humanizeCode(key);
}

export function ledgerSourceTypeLabel(sourceType?: string | null): string {
  const key = String(sourceType ?? "").toLowerCase();
  if (!key) return "—";
  return SOURCE_TYPE_LABELS[key] ?? humanizeCode(key);
}

export function ledgerStatusLabel(status?: string | null): string {
  const key = String(status ?? "posted").toLowerCase();
  return LEDGER_STATUS_LABELS[key] ?? humanizeCode(key);
}

function mapLedgerStatus(value?: string | null): string {
  const key = String(value ?? "posted").toLowerCase();
  if (key === "failed" || key === "rejected") return "failed";
  if (key === "pending") return "pending";
  return "posted";
}

function resolveOwnerName(item: ApiFinanceTransactionItem): string {
  return (
    item.owner_name?.trim() ||
    item.wallet?.owner?.displayName?.trim() ||
    item.wallet?.owner?.driverCode?.trim() ||
    item.entity_ref?.trim() ||
    "—"
  );
}

function resolveFranchiseName(item: ApiFinanceTransactionItem): string {
  return item.franchise_name?.trim() || item.franchise?.name?.trim() || "—";
}

export function mapLedgerEntry(item: ApiFinanceTransactionItem): LedgerEntry {
  const record = item as ApiFinanceTransactionItem & {
    txn_id?: string;
    txnId?: string;
    balance_bucket?: string;
    balanceBucket?: string;
    wallet_id?: string;
    walletId?: string;
    source_type?: string;
    sourceType?: string;
    source_id?: string;
    sourceId?: string;
  };

  return {
    id: item.id,
    txn_id: record.txn_id ?? record.txnId ?? item.entity_ref ?? undefined,
    entry_type: String(item.entry_type ?? item.type ?? "ledger"),
    direction:
      String(item.direction ?? "credit").toLowerCase() === "debit" ? "debit" : "credit",
    amount_xof: item.amount_fcfa ?? item.amount_xof ?? item.amountXof ?? 0,
    balance_bucket: record.balance_bucket ?? record.balanceBucket,
    wallet_id: record.wallet_id ?? record.walletId ?? item.wallet?.id,
    owner_name: resolveOwnerName(item),
    franchise_name: resolveFranchiseName(item),
    source_type: record.source_type ?? record.sourceType ?? item.entity_type,
    source_id: record.source_id ?? record.sourceId ?? item.order?.id,
    order_ref: item.order?.ref,
    status: mapLedgerStatus(item.status),
    description: item.label ?? item.description,
    posted_at: item.posted_at ?? item.created_at ?? item.createdAt ?? new Date().toISOString(),
  };
}

export function mapLedgerListResponse(
  response: ApiFinanceListResponse<ApiFinanceTransactionItem>,
  params?: ListParams
): LedgerListResponse {
  const responseWithEntries = response as ApiFinanceListResponse<ApiFinanceTransactionItem> & {
    entries?: ApiFinanceTransactionItem[];
  };
  const sourceItems = response.items ?? responseWithEntries.entries ?? [];
  const mapped = sourceItems.map(mapLedgerEntry);
  const page =
    response.pagination != null
      ? {
          data: mapped,
          meta: mapV1PaginationToMeta(response.pagination, params),
        }
      : paginateClientList(mapped, params);

  const summary = response.summary ?? {};
  const computedCredits = mapped
    .filter((row) => row.direction === "credit")
    .reduce((acc, row) => acc + row.amount_xof, 0);
  const computedDebits = mapped
    .filter((row) => row.direction === "debit")
    .reduce((acc, row) => acc + row.amount_xof, 0);
  return {
    ...page,
    summary: {
      credits_xof: Number(
        summary.credits_xof ?? summary.creditsTodayFcfa ?? computedCredits
      ),
      debits_xof: Number(
        summary.debits_xof ?? summary.debitsTodayFcfa ?? computedDebits
      ),
      net_xof: Number(summary.net_xof ?? computedCredits - computedDebits),
    },
    filter_options: mapOrdersFilterOptions(response.filterOptions),
  };
}
