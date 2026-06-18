import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  PartnerWallet,
  Paginated,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { DriverRechargeBatchPayload } from "@/features/finance/api/driverRecharge.v1.service";

interface LegacyWalletData {
  id?: number;
  partner_id?: number;
  balance_fcfa?: number;
  available_fcfa?: number;
  pending_withdrawal_fcfa?: number;
  currency?: string;
  last_withdrawal?: {
    id?: string;
    amount_fcfa?: number;
    status?: string;
    processed_at?: string;
  };
  recent_movements?: {
    id?: string;
    label?: string;
    amount_fcfa?: number;
    direction?: "credit" | "debit";
    created_at?: string;
  }[];
}

interface WalletApiResponse {
  success?: boolean;
  status?: string;
  data?: LegacyWalletData;
  wallet?: {
    id?: string;
    owner_type?: string;
    owner_id?: string;
    currency?: string;
    status?: string;
    balance_cached_xof?: number;
    withdrawable_balance_xof?: number;
    non_withdrawable_balance_xof?: number;
    daily_withdrawal_cap_xof?: number;
    today_withdrawn_xof?: number;
    last_calculated_at?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
}

function mapWalletResponse(response: WalletApiResponse | PartnerWallet): PartnerWallet {
  // Nouveau format API v2 (wallet direct)
  if ("wallet" in response && response.wallet) {
    const w = response.wallet;
    const balance = w.balance_cached_xof ?? 0;
    const withdrawable = w.withdrawable_balance_xof;
    const nonWithdrawable = w.non_withdrawable_balance_xof;
    return {
      balance_fcfa: balance,
      withdrawable_fcfa: withdrawable,
      non_withdrawable_fcfa: nonWithdrawable,
      available_fcfa: withdrawable ?? balance,
      pending_withdrawal_fcfa: 0,
      daily_cap_fcfa: w.daily_withdrawal_cap_xof ?? 30_000,
      today_withdrawn_fcfa: w.today_withdrawn_xof ?? 0,
      last_withdrawal: undefined,
      recent_movements: [],
    };
  }

  // Legacy format (success + data)
  if ("success" in response && response.success && response.data) {
    const d = response.data;
    return {
      balance_fcfa: d.balance_fcfa ?? 0,
      available_fcfa: d.available_fcfa ?? 0,
      pending_withdrawal_fcfa: d.pending_withdrawal_fcfa ?? 0,
      last_withdrawal: d.last_withdrawal
        ? {
            id: d.last_withdrawal.id ?? "",
            amount_fcfa: d.last_withdrawal.amount_fcfa ?? 0,
            status: d.last_withdrawal.status ?? "",
            processed_at: d.last_withdrawal.processed_at ?? "",
          }
        : undefined,
      recent_movements:
        d.recent_movements?.map((m) => ({
          id: m.id ?? "",
          label: m.label ?? "",
          amount_fcfa: m.amount_fcfa ?? 0,
          direction: m.direction ?? "credit",
          created_at: m.created_at ?? "",
        })) ?? [],
    };
  }
  return response as PartnerWallet;
}

export interface CashReconciliation {
  id: string;
  driver_id: string;
  driver_name?: string;
  amount_fcfa: number;
  status: "pending" | "submitted" | "validated" | "rejected";
  collected_at: string;
  submitted_at?: string;
  validated_at?: string;
  note?: string;
}

export interface DriverRechargePayload {
  driver_id: string | number;
  amount_fcfa: number;
  note?: string;
}

export interface LedgerEntry {
  id: string;
  label: string;
  amount_fcfa: number;
  direction: "credit" | "debit";
  balance_after_fcfa?: number;
  created_at: string;
}

interface LedgerApiItem {
  id: string;
  wallet_id: string;
  entry_type: string;
  direction: "credit" | "debit";
  amount_xof: number;
  currency: string;
  service_type: string | null;
  order_id: string | null;
  related_wallet_id: string | null;
  source_type: string | null;
  source_id: string | null;
  status: string;
  description: string;
  idempotency_key: string | null;
  metadata?: Record<string, unknown>;
  posted_at: string;
  created_at: string;
}

interface LedgerApiResponse {
  status: string;
  items: LedgerApiItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

type RawTransferItem = LedgerApiItem & {
  metadata?: {
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    partnerId?: string;
    actorUserId?: string;
    transferGroupId?: string;
    source?: string;
    [key: string]: unknown;
  };
};

function extractDriverIdFromKey(key: string | null): string | null {
  if (!key) return null;
  const m = key.match(/driver[:/]([a-f0-9-]{36})/i);
  return m ? m[1] : null;
}

function mapRawTransferItem(item: RawTransferItem): import("@/shared/types").PartnerDriverTransfer {
  const meta = item.metadata ?? {};
  const rawStatus = item.status;
  const status: import("@/shared/types").PartnerDriverTransferStatus =
    rawStatus === "posted" || rawStatus === "completed"
      ? "completed"
      : rawStatus === "pending"
      ? "pending"
      : "failed";

  const driverId =
    (meta.driverId as string) ??
    extractDriverIdFromKey(item.idempotency_key) ??
    item.wallet_id;

  const driverName = (meta.driverName as string) ?? null;
  const driverPhone = (meta.driverPhone as string) ?? null;

  const displayName = driverName ?? `ID: ${driverId.slice(-8).toUpperCase()}`;
  const displayPhone = driverPhone ?? "—";

  return {
    id: item.id,
    ref: item.idempotency_key
      ? item.idempotency_key.slice(-8).toUpperCase()
      : item.id.slice(-8).toUpperCase(),
    driver_id: driverId,
    driver_name: displayName,
    driver_phone: displayPhone,
    amount_fcfa: item.amount_xof,
    status,
    mobile_wallet_credited: status === "completed",
    note: item.description || undefined,
    created_at: item.posted_at || item.created_at,
  };
}

function mapLedgerItem(item: LedgerApiItem): LedgerEntry {
  return {
    id: item.id,
    label: item.description || item.entry_type.replace(/_/g, " "),
    amount_fcfa: item.amount_xof,
    direction: item.direction,
    balance_after_fcfa: undefined,
    created_at: item.posted_at || item.created_at,
  };
}

function mapLedgerResponse(response: LedgerApiResponse): Paginated<LedgerEntry> {
  return {
    data: response.items.map(mapLedgerItem),
    meta: {
      current_page: response.pagination.page,
      per_page: response.pagination.limit,
      total: response.pagination.total,
      last_page: response.pagination.hasMore
        ? response.pagination.page + 1
        : response.pagination.page,
    },
  };
}

export interface SettlementEntry {
  id: string;
  ref: string;
  amount_fcfa: number;
  status: "pending" | "processed" | "failed" | "cancelled";
  period_start?: string;
  period_end?: string;
  processed_at?: string;
  created_at: string;
}

interface SettlementsApiResponse {
  status?: string;
  items?: SettlementEntry[];
  data?: SettlementEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

function mapSettlementsResponse(response: SettlementsApiResponse): Paginated<SettlementEntry> {
  // Format {status:"ok", items, pagination}
  if (response.status === "ok" && Array.isArray(response.items)) {
    const p = response.pagination;
    return {
      data: response.items,
      meta: p
        ? {
            current_page: p.page,
            per_page: p.limit,
            total: p.total,
            last_page: p.hasMore ? p.page + 1 : p.page,
          }
        : { current_page: 1, per_page: 20, total: response.items.length, last_page: 1 },
    };
  }
  // Format standard {data, meta}
  if (Array.isArray(response.data)) {
    return response as Paginated<SettlementEntry>;
  }
  // Fallback: réponse vide sans lever d'erreur
  return { data: [], meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 } };
}

export interface RevenueEntry {
  id: string;
  wallet_id: string;
  entry_type: string;
  direction: "credit" | "debit";
  amount_xof: number;
  currency: string;
  service_type: string | null;
  order_id: string | null;
  related_wallet_id: string | null;
  source_type: string | null;
  source_id: string | null;
  status: string;
  description: string;
  idempotency_key: string | null;
  metadata?: Record<string, unknown>;
  posted_at: string;
  created_at: string;
}

export interface PartnerRevenueResponse {
  status: string;
  totalXof: number;
  entries: RevenueEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const partnerWalletService = {
  get: async (partnerId: string | number) => {
    const response = await apiClient.get<WalletApiResponse>(
      LINKS.partner.wallet.get(partnerId)
    );
    return mapWalletResponse(response);
  },

  ledger: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<LedgerApiResponse>(
      `${LINKS.partner.wallet.ledger(partnerId)}${buildListQuery(params)}`
    );
    return mapLedgerResponse(response);
  },

  settlements: async (partnerId: string | number, params?: ListParams) => {
    try {
      const response = await apiClient.get<SettlementsApiResponse>(
        `${LINKS.partner.wallet.settlements(partnerId)}${buildListQuery(params)}`
      );
      return mapSettlementsResponse(response);
    } catch {
      // L'endpoint /settlements est cassé backend (PAYOUTS_FETCH_FAILED / colonne manquante).
      // On retourne un résultat vide pour ne pas bloquer l'UI.
      return { data: [], meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 } } as Paginated<SettlementEntry>;
    }
  },

  revenue: (partnerId: string | number) =>
    apiClient.get<PartnerRevenueResponse>(LINKS.partner.wallet.revenue(partnerId)),

  withdraw: (partnerId: string | number, amount_fcfa: number) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      withdrawal_id: string;
      wallet: PartnerWallet;
    }>(LINKS.partner.wallet.withdraw(partnerId), { amount_fcfa }),

  getDriverRechargeStats: async (partnerId: string | number) => {
    const response = await apiClient.get<{
      status?: string;
      stats?: {
        totalTransfers?: number;
        totalAmountXof?: number;
        monthTransfers?: number;
        monthAmountXof?: number;
        recentTransfers?: { posted_at?: string; created_at?: string }[];
      };
    }>(LINKS.partner.wallet.driverTransfers.stats(partnerId));

    const s = response.stats;
    const recent = s?.recentTransfers ?? [];
    const lastTransfer = recent[0];
    return {
      total_spent_fcfa: s?.totalAmountXof ?? 0,
      transfers_count: s?.totalTransfers ?? 0,
      month_spent_fcfa: s?.monthAmountXof ?? 0,
      month_transfers_count: s?.monthTransfers ?? 0,
      last_transfer_at: lastTransfer?.posted_at ?? lastTransfer?.created_at,
    } as PartnerDriverRechargeStats;
  },

  listDriverTransfers: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<{
      status?: string;
      items?: RawTransferItem[];
      transfers?: RawTransferItem[];
      data?: RawTransferItem[];
      pagination?: { page: number; limit: number; total: number; hasMore: boolean };
      meta?: { current_page: number; per_page: number; total: number; last_page: number };
    }>(`${LINKS.partner.wallet.driverTransfers.list(partnerId)}${buildListQuery(params)}`);

    const all = response.items ?? response.transfers ?? response.data ?? [];
    const DRIVER_RECHARGE_TYPES = ["partner_driver_recharge", "welcome_bonus"];
    const raw = all.filter((item) => DRIVER_RECHARGE_TYPES.includes(item.entry_type));
    const p = response.pagination;
    const m = response.meta;
    const meta = p
      ? { current_page: p.page, per_page: p.limit, total: p.total, last_page: p.hasMore ? p.page + 1 : p.page }
      : m ?? { current_page: 1, per_page: 25, total: raw.length, last_page: 1 };

    return {
      data: raw.map(mapRawTransferItem),
      meta,
    } as Paginated<PartnerDriverTransfer>;
  },

  rechargeDriver: (partnerId: string | number, payload: DriverRechargePayload) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      transfer: PartnerDriverTransfer;
      wallet: PartnerWallet;
      stats: PartnerDriverRechargeStats;
    }>(LINKS.partner.wallet.driverRecharge(partnerId), {
      ...payload,
      driver_id: String(payload.driver_id),
    }),

  cashReconciliations: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<CashReconciliation>>(
      `${LINKS.partner.wallet.cashReconciliations(partnerId)}${buildListQuery(params)}`
    ),

  rechargeDrivers: async (
    partnerId: string | number,
    batch: DriverRechargeBatchPayload
  ) => {
    const ids = batch.driver_ids.map((id) => id.trim()).filter(Boolean);
    if (!ids.length) {
      throw new Error("Sélectionnez au moins un chauffeur.");
    }
    let last: Awaited<ReturnType<typeof partnerWalletService.rechargeDriver>>;
    for (const driver_id of ids) {
      last = await partnerWalletService.rechargeDriver(partnerId, {
        driver_id,
        amount_fcfa: batch.amount_fcfa,
        note: batch.note,
      });
    }
    return last!;
  },
};
