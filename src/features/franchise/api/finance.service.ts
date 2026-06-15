import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import {
  fetchDriverTransferListV1,
  fetchDriverTransferStatsV1,
  postDriverRechargeBatchV1,
  postDriverRechargeV1,
  type DriverRechargeBatchPayload,
  type DriverRechargePayload,
} from "@/features/finance/api/driverRecharge.v1.service";
import type {
  FranchisePartnerTransfer,
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  Paginated,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchiseWithdrawal {
  id: string;
  amount_xof: number;
  status: "pending" | "approved" | "paid" | "rejected" | string;
  destination_type: string | null;
  destination_identifier: string | null;
  partner_id: string | null;
  payout_method: string | null;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

export interface FranchiseFinance {
  balance_fcfa: number;
  commission_month_fcfa: number;
  payouts_pending_fcfa: number;
  payouts_pending_count: number;
  available_fcfa: number;
  transactions: {
    id: string;
    label: string;
    amount_fcfa: number;
    direction: "credit" | "debit";
    created_at: string;
  }[];
  withdrawals: FranchiseWithdrawal[];
}

export type FranchiseDriverRechargePayload = DriverRechargePayload;
export type FranchiseDriverRechargeBatchPayload = DriverRechargeBatchPayload;

export interface FranchisePartnerRechargePayload {
  partner_id: number;
  amount_fcfa: number;
  note?: string;
}

// ─── Mappers v1 (backend retourne _xof, frontend attend _fcfa) ───────────────

function mapV1Finance(raw: Record<string, any>): FranchiseFinance {
  const wallet = raw.wallet ?? {};
  const summary = raw.summary ?? {};
  const withdrawals: FranchiseWithdrawal[] = (raw.withdrawals ?? []).map((w: any) => ({
    id: w.id,
    amount_xof: w.amount_xof ?? 0,
    status: w.status ?? "pending",
    destination_type: w.destination_type ?? null,
    destination_identifier: w.destination_identifier ?? null,
    partner_id: w.metadata?.partnerId ?? null,
    payout_method: w.metadata?.payoutMethod ?? null,
    created_at: w.created_at ?? new Date().toISOString(),
    approved_at: w.approved_at ?? null,
    paid_at: w.paid_at ?? null,
  }));
  return {
    balance_fcfa:
      raw.balance_fcfa ?? summary.wallet_balance_xof ?? wallet.balance_cached_xof ?? 0,
    available_fcfa:
      raw.available_fcfa ?? summary.available_xof ?? wallet.available_xof ?? 0,
    commission_month_fcfa:
      raw.commission_month_fcfa ??
      summary.commissions_xof ??
      summary.commissions_month_xof ??
      0,
    payouts_pending_fcfa:
      raw.payouts_pending_fcfa ??
      summary.pending_withdrawals_xof ??
      summary.pending_withdrawal_xof ??
      wallet.pending_withdrawal_xof ??
      0,
    payouts_pending_count: summary.pending_withdrawals_count ?? withdrawals.filter((w) => w.status === "pending").length,
    transactions: (wallet.recent_movements ?? raw.recent_movements ?? raw.transactions ?? []).map((m: any) => ({
      id: m.id ?? m.entry_id ?? String(Math.random()),
      label: m.description ?? m.label ?? "Mouvement",
      amount_fcfa: m.amount_xof ?? m.amount_fcfa ?? 0,
      direction: m.direction === "credit" ? "credit" : "debit",
      created_at: m.created_at ?? m.posted_at ?? new Date().toISOString(),
    })),
    withdrawals,
  };
}

function mapV1RechargeStats(raw: Record<string, any>): PartnerDriverRechargeStats {
  return {
    total_spent_fcfa: raw.total_amount_xof ?? raw.total_spent_fcfa ?? 0,
    transfers_count: raw.total_transfers ?? raw.credit_count ?? raw.transfers_count ?? 0,
    month_spent_fcfa: raw.month_amount_xof ?? raw.month_spent_fcfa ?? 0,
    month_transfers_count: raw.month_transfers ?? raw.month_transfers_count ?? 0,
    last_transfer_at: raw.last_transfer_at ?? null,
  };
}

function mapV1DriverTransfer(item: Record<string, any>): PartnerDriverTransfer {
  return {
    id: item.id,
    ref: item.idempotency_key ?? item.ref ?? item.id.slice(0, 8).toUpperCase(),
    driver_id: item.source_id ?? item.driver_id ?? "",
    driver_name: item.driver_name ?? item.description ?? "—",
    driver_phone: item.driver_phone ?? "—",
    amount_fcfa: item.amount_xof ?? item.amount_fcfa ?? 0,
    status: item.status === "posted" ? "completed" : (item.status ?? "pending"),
    mobile_wallet_credited: item.status === "posted",
    note: item.description ?? item.note ?? undefined,
    created_at: item.created_at ?? item.posted_at ?? new Date().toISOString(),
  };
}

function mapV1PartnerTransfer(item: Record<string, any>): FranchisePartnerTransfer {
  return {
    id: item.id,
    ref: item.idempotency_key ?? item.ref ?? item.id.slice(0, 8).toUpperCase(),
    partner_id: item.source_id ?? item.partner_id ?? 0,
    partner_name: item.partner_name ?? item.description ?? "—",
    amount_fcfa: item.amount_xof ?? item.amount_fcfa ?? 0,
    status: item.status === "posted" ? "completed" : (item.status ?? "pending"),
    note: item.description ?? item.note ?? undefined,
    created_at: item.created_at ?? item.posted_at ?? new Date().toISOString(),
  };
}

function mapV1Paginated<T>(
  raw: Record<string, any>,
  mapper: (item: any) => T
): Paginated<T> {
  const items = raw.items ?? raw.transfers ?? raw.data ?? [];
  const pg = raw.pagination ?? {};
  return {
    data: items.map(mapper),
    meta: {
      total: pg.total ?? items.length,
      per_page: pg.limit ?? 20,
      current_page: pg.page ?? 1,
      last_page: Math.max(1, Math.ceil((pg.total ?? items.length) / (pg.limit ?? 20))),
    },
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const franchiseFinanceService = {
  get: async (): Promise<FranchiseFinance> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchiseFinance>("/franchise/finance");
    }
    const raw = await apiClient.get<Record<string, any>>(LINKS.franchise.v1.finance);
    return mapV1Finance(raw);
  },

  getDriverRechargeStats: async (): Promise<PartnerDriverRechargeStats> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<PartnerDriverRechargeStats>(
        "/franchise/finance/driver-transfers/stats"
      );
    }
    return fetchDriverTransferStatsV1(
      LINKS.franchise.v1.driverTransfersStats
    );
  },

  listDriverTransfers: async (
    params?: ListParams
  ): Promise<Paginated<PartnerDriverTransfer>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<PartnerDriverTransfer>>(
        `/franchise/finance/driver-transfers${buildListQuery(params)}`
      );
    }
    return fetchDriverTransferListV1(
      LINKS.franchise.v1.driverTransfers,
      params
    );
  },

  rechargeDriver: async (payload: FranchiseDriverRechargePayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<{
        ok: boolean;
        message: string;
        transfer: PartnerDriverTransfer;
        finance: FranchiseFinance;
        stats: PartnerDriverRechargeStats;
      }>("/franchise/finance/driver-recharge", {
        driver_id: Number(payload.driver_id) || payload.driver_id,
        amount_fcfa: payload.amount_fcfa,
        note: payload.note,
      });
    }

    const result = await postDriverRechargeV1(
      LINKS.franchise.v1.driverRecharge,
      payload
    );
    return {
      ok: result.ok,
      message: result.message,
      transfer:
        result.transfer ??
        ({
          id: `pending-${Date.now()}`,
          ref: "PENDING",
          driver_id: payload.driver_id,
          driver_name: "—",
          driver_phone: "—",
          amount_fcfa: payload.amount_fcfa,
          status: "pending",
          mobile_wallet_credited: false,
          note: payload.note,
          created_at: new Date().toISOString(),
        } satisfies PartnerDriverTransfer),
      finance: await franchiseFinanceService.get(),
      stats: await franchiseFinanceService.getDriverRechargeStats(),
    };
  },

  rechargeDrivers: async (batch: FranchiseDriverRechargeBatchPayload) => {
    if (useLegacyPortalApi()) {
      let last:
        | {
            ok: boolean;
            message: string;
            transfer: PartnerDriverTransfer;
            finance: FranchiseFinance;
            stats: PartnerDriverRechargeStats;
          }
        | undefined;
      for (const driver_id of batch.driver_ids) {
        last = await franchiseFinanceService.rechargeDriver({
          driver_id,
          amount_fcfa: batch.amount_fcfa,
          note: batch.note,
        });
      }
      if (!last) throw new Error("Aucun chauffeur sélectionné.");
      return last;
    }

    const result = await postDriverRechargeBatchV1(
      LINKS.franchise.v1.driverRecharge,
      batch
    );
    return {
      ok: result.ok,
      message: result.message,
      transfer:
        result.transfer ??
        ({
          id: `batch-${Date.now()}`,
          ref: "BATCH",
          driver_id: batch.driver_ids[0] ?? "",
          driver_name: "—",
          driver_phone: "—",
          amount_fcfa: batch.amount_fcfa,
          status: "pending",
          mobile_wallet_credited: false,
          created_at: new Date().toISOString(),
        } satisfies PartnerDriverTransfer),
      finance: await franchiseFinanceService.get(),
      stats: await franchiseFinanceService.getDriverRechargeStats(),
    };
  },

  getPartnerRechargeStats: async (): Promise<PartnerDriverRechargeStats> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<PartnerDriverRechargeStats>("/franchise/finance/partner-transfers/stats");
    }
    const raw = await apiClient.get<Record<string, any>>(LINKS.franchise.v1.partnerTransfersStats);
    return mapV1RechargeStats(raw);
  },

  listPartnerTransfers: async (params?: ListParams): Promise<Paginated<FranchisePartnerTransfer>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchisePartnerTransfer>>(
        `/franchise/finance/partner-transfers${buildListQuery(params)}`
      );
    }
    const raw = await apiClient.get<Record<string, any>>(
      appendQuery(LINKS.franchise.v1.partnerTransfers, buildV1ListQuery(params))
    );
    return mapV1Paginated(raw, mapV1PartnerTransfer);
  },

  rechargePartner: async (payload: FranchisePartnerRechargePayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<{
        ok: boolean; message: string;
        transfer: FranchisePartnerTransfer; finance: FranchiseFinance; stats: PartnerDriverRechargeStats;
      }>("/franchise/finance/partner-recharge", payload);
    }
    const raw = await apiClient.post<Record<string, any>>(LINKS.franchise.v1.partnerRecharge, {
      partner_id: payload.partner_id,
      amount_xof: payload.amount_fcfa,
      note: payload.note,
    });
    return {
      ok: raw.status === "ok",
      message: raw.message ?? "Recharge effectuée",
      transfer: mapV1PartnerTransfer(raw.transfer ?? raw.entry ?? {}),
      finance: mapV1Finance(raw.wallet ? raw : {}),
      stats: mapV1RechargeStats(raw.stats ?? {}),
    };
  },
};
