import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
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

export interface FranchiseFinance {
  balance_fcfa: number;
  commission_month_fcfa: number;
  payouts_pending_fcfa: number;
  available_fcfa: number;
  transactions: {
    id: string;
    label: string;
    amount_fcfa: number;
    direction: "credit" | "debit";
    created_at: string;
  }[];
}

export type FranchiseDriverRechargePayload = DriverRechargePayload;
export type FranchiseDriverRechargeBatchPayload = DriverRechargeBatchPayload;

export interface FranchisePartnerRechargePayload {
  partner_id: number;
  amount_fcfa: number;
  note?: string;
}

export const franchiseFinanceService = {
  get: () => apiClient.get<FranchiseFinance>("/franchise/finance"),

  getDriverRechargeStats: async (): Promise<PartnerDriverRechargeStats> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<PartnerDriverRechargeStats>(
        "/franchise/finance/driver-transfers/stats"
      );
    }
    return fetchDriverTransferStatsV1(
      LINKS.v1.franchise.finance.driverTransferStats
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
      LINKS.v1.franchise.finance.driverTransfers,
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
      LINKS.v1.franchise.finance.driverRecharge,
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
      LINKS.v1.franchise.finance.driverRecharge,
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

  getPartnerRechargeStats: () =>
    apiClient.get<PartnerDriverRechargeStats>(
      useLegacyPortalApi()
        ? "/franchise/finance/partner-transfers/stats"
        : "/v1/franchise/finance/partner-transfers/stats"
    ),

  listPartnerTransfers: (params?: ListParams) =>
    apiClient.get<Paginated<FranchisePartnerTransfer>>(
      `${
        useLegacyPortalApi()
          ? "/franchise/finance/partner-transfers"
          : "/v1/franchise/finance/partner-transfers"
      }${buildListQuery(params)}`
    ),

  rechargePartner: (payload: FranchisePartnerRechargePayload) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      transfer: FranchisePartnerTransfer;
      finance: FranchiseFinance;
      stats: PartnerDriverRechargeStats;
    }>(
      useLegacyPortalApi()
        ? "/franchise/finance/partner-recharge"
        : "/v1/franchise/finance/partner-recharge",
      payload
    ),
};
