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
    return {
      balance_fcfa: balance,
      available_fcfa: balance,
      pending_withdrawal_fcfa: 0,
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

  settlements: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<SettlementEntry>>(
      `${LINKS.partner.wallet.settlements(partnerId)}${buildListQuery(params)}`
    ),

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
        recentTransfers?: unknown[];
      };
    }>(LINKS.partner.wallet.driverTransfers.stats(partnerId));

    const s = response.stats;
    return {
      total_spent_fcfa: s?.totalAmountXof ?? 0,
      transfers_count: s?.totalTransfers ?? 0,
      month_spent_fcfa: s?.monthAmountXof ?? 0,
      month_transfers_count: s?.monthTransfers ?? 0,
    } as PartnerDriverRechargeStats;
  },

  listDriverTransfers: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<PartnerDriverTransfer>>(
      `${LINKS.partner.wallet.driverTransfers.list(partnerId)}${buildListQuery(params)}`
    ),

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
