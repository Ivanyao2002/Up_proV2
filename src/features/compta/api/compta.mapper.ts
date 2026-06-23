import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiFinanceListResponse, ApiFinanceTransactionItem } from "@/features/finance/api/adminFinance.api.types";
import { mapOrdersFilterOptions } from "@/features/ops/api/adminOrders.mapper";
import { formatFCFA } from "@/shared/lib/format";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { LedgerBreakdownItem, LedgerEntry, LedgerListResponse } from "./compta.types";

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

const SERVICE_TYPE_LABELS: Record<string, string> = {
  RIDE: "Course VTC",
  DELIVERY: "Livraison",
  DELIVERY_CARGO: "Livraison fret",
  FREIGHT: "Fret",
  RENTAL: "Location",
};

/** Libellés français pour les champs `metadata` renvoyés par l'API ledger. */
const METADATA_FIELD_LABELS: Record<string, string> = {
  grossAmountXof: "Montant brut",
  gross_amount_xof: "Montant brut",
  driverAmountXof: "Part chauffeur",
  driver_amount_xof: "Part chauffeur",
  partnerAmountXof: "Part partenaire",
  partner_amount_xof: "Part partenaire",
  platformAmountXof: "Commission plateforme",
  platform_amount_xof: "Commission plateforme",
  fiscalityAmountXof: "Fiscalité",
  fiscality_amount_xof: "Fiscalité",
  franchiseAmountXof: "Part franchise",
  franchise_amount_xof: "Part franchise",
  fromWithdrawableXof: "Prélevé (retirable)",
  from_withdrawable_xof: "Prélevé (retirable)",
  fromNonWithdrawableXof: "Prélevé (service)",
  from_non_withdrawable_xof: "Prélevé (service)",
  driverId: "Chauffeur",
  driver_id: "Chauffeur",
  partnerId: "Partenaire",
  partner_id: "Partenaire",
  actorUserId: "Utilisateur",
  actor_user_id: "Utilisateur",
  transferGroupId: "Groupe transfert",
  transfer_group_id: "Groupe transfert",
  source: "Origine",
};

/** Ordre d'affichage des ventilations dans le panneau détail. */
const METADATA_DISPLAY_ORDER = [
  "grossAmountXof",
  "gross_amount_xof",
  "driverAmountXof",
  "driver_amount_xof",
  "partnerAmountXof",
  "partner_amount_xof",
  "platformAmountXof",
  "platform_amount_xof",
  "fiscalityAmountXof",
  "fiscality_amount_xof",
  "franchiseAmountXof",
  "franchise_amount_xof",
  "fromWithdrawableXof",
  "from_withdrawable_xof",
  "fromNonWithdrawableXof",
  "from_non_withdrawable_xof",
  "driverId",
  "driver_id",
  "partnerId",
  "partner_id",
  "actorUserId",
  "actor_user_id",
  "source",
  "transferGroupId",
  "transfer_group_id",
] as const;

const AMOUNT_METADATA_KEYS = new Set([
  "grossAmountXof",
  "gross_amount_xof",
  "driverAmountXof",
  "driver_amount_xof",
  "partnerAmountXof",
  "partner_amount_xof",
  "platformAmountXof",
  "platform_amount_xof",
  "fiscalityAmountXof",
  "fiscality_amount_xof",
  "franchiseAmountXof",
  "franchise_amount_xof",
  "fromWithdrawableXof",
  "from_withdrawable_xof",
  "fromNonWithdrawableXof",
  "from_non_withdrawable_xof",
]);

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

export function ledgerServiceTypeLabel(serviceType?: string | null): string {
  const key = String(serviceType ?? "").toUpperCase();
  if (!key) return "—";
  return SERVICE_TYPE_LABELS[key] ?? humanizeCode(key);
}

function readMetadataValue(
  metadata: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    const value = metadata[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function formatMetadataScalar(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatFCFA(value);
  }
  if (typeof value === "string" && value.length > 24 && /^[0-9a-f-]{36}$/i.test(value)) {
    return `${value.slice(0, 8)}…`;
  }
  return String(value);
}

/** Détail lisible : description API + ventilation metadata (commissions, recharges…). */
export function formatLedgerDetailLines(entry: LedgerEntry): string[] {
  const lines: string[] = [];
  const description = entry.description?.trim();
  if (description) lines.push(description);

  const metadata = entry.metadata;
  if (!metadata || typeof metadata !== "object") return lines;

  const seen = new Set<string>();
  for (const [key, label] of Object.entries(METADATA_FIELD_LABELS)) {
    const value = readMetadataValue(metadata, key);
    if (value === undefined || seen.has(label)) continue;
    seen.add(label);
    lines.push(`${label} : ${formatMetadataScalar(value)}`);
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (METADATA_FIELD_LABELS[key] || value === undefined || value === null || value === "") {
      continue;
    }
    const label = humanizeCode(key);
    if (seen.has(label)) continue;
    seen.add(label);
    lines.push(`${label} : ${formatMetadataScalar(value)}`);
  }

  return lines;
}

export function ledgerEntryTitle(entry: LedgerEntry): string {
  const description = entry.description?.trim();
  if (description) return description;
  return ledgerEntryTypeLabel(entry.entry_type);
}

export function ledgerEntrySubtitle(entry: LedgerEntry): string | null {
  const owner = inferLedgerOwnerLabel(entry);
  const parts: string[] = [];
  if (owner) parts.push(owner);
  const service = entry.service_type ? ledgerServiceTypeLabel(entry.service_type) : null;
  if (service && service !== "—") parts.push(service);
  if (entry.order_id) parts.push(`Course ${entry.order_id.slice(0, 8)}`);
  return parts.length ? parts.join(" · ") : null;
}

export function inferLedgerOwnerLabel(entry: LedgerEntry): string | null {
  const name = entry.owner_name?.trim();
  if (name && name !== "—") return name;

  const desc = (entry.description ?? "").toLowerCase();
  if (desc.includes("plateforme")) return "Plateforme";
  if (desc.includes("franchise")) return "Franchise";
  if (desc.includes("partenaire") || entry.entry_type.includes("partner")) return "Partenaire";
  if (desc.includes("chauffeur") || desc.includes("prélevée") || desc.includes("driver")) {
    return "Chauffeur";
  }
  return null;
}

export function ledgerBreakdownItems(entry: LedgerEntry): LedgerBreakdownItem[] {
  const metadata = entry.metadata;
  if (!metadata || typeof metadata !== "object") return [];

  const items: LedgerBreakdownItem[] = [];
  const seenLabels = new Set<string>();

  for (const key of METADATA_DISPLAY_ORDER) {
    const label = METADATA_FIELD_LABELS[key];
    if (!label || seenLabels.has(label)) continue;
    const value = readMetadataValue(metadata, key);
    if (value === undefined) continue;
    seenLabels.add(label);
    items.push({
      label,
      value: formatMetadataScalar(value),
      isAmount: AMOUNT_METADATA_KEYS.has(key),
    });
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (METADATA_FIELD_LABELS[key] || value === undefined || value === null || value === "") {
      continue;
    }
    const label = humanizeCode(key);
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    items.push({
      label,
      value: formatMetadataScalar(value),
      isAmount: typeof value === "number",
    });
  }

  return items;
}

export function ledgerEntryAccent(entry: LedgerEntry): "teal" | "gold" | "slate" | "rose" {
  const type = entry.entry_type.toLowerCase();
  if (type.includes("commission")) return "teal";
  if (type.includes("recharge") || type.includes("wallet")) return "gold";
  if (type.includes("bonus") || type.includes("welcome")) return "slate";
  if (type.includes("withdrawal") || type.includes("reversal")) return "rose";
  return "teal";
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
    order_id?: string;
    orderId?: string;
    service_type?: string;
    serviceType?: string;
    metadata?: Record<string, unknown>;
  };

  const metadata =
    record.metadata && typeof record.metadata === "object" ? record.metadata : undefined;

  const orderId = record.order_id ?? record.orderId ?? item.order?.id;
  const commission = item.commissionBreakdown;
  const mergedMetadata: Record<string, unknown> | undefined =
    metadata || commission
      ? {
          ...(commission?.grossAmountXof != null
            ? { grossAmountXof: commission.grossAmountXof }
            : {}),
          ...(commission?.driverAmountXof != null
            ? { driverAmountXof: commission.driverAmountXof }
            : {}),
          ...(commission?.partnerAmountXof != null
            ? { partnerAmountXof: commission.partnerAmountXof }
            : {}),
          ...(commission?.platformAmountXof != null
            ? { platformAmountXof: commission.platformAmountXof }
            : {}),
          ...(commission?.fiscalityAmountXof != null
            ? { fiscalityAmountXof: commission.fiscalityAmountXof }
            : {}),
          ...(commission?.franchiseAmountXof != null
            ? { franchiseAmountXof: commission.franchiseAmountXof }
            : {}),
          ...metadata,
        }
      : undefined;

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
    source_id: record.source_id ?? record.sourceId ?? orderId,
    order_id: orderId,
    order_ref: item.order?.ref,
    service_type: record.service_type ?? record.serviceType ?? item.order?.serviceType,
    status: mapLedgerStatus(item.status),
    description: item.label ?? item.description,
    metadata: mergedMetadata && Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
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
