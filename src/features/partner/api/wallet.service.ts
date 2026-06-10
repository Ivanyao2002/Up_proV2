import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { useAuthStore } from "@/core/auth/authStore";
import {
  fetchDriverTransferListV1,
  fetchDriverTransferStatsV1,
  postDriverRechargeBatchV1,
  postDriverRechargeV1,
  type DriverRechargeBatchPayload,
  type DriverRechargePayload,
} from "@/features/finance/api/driverRecharge.v1.service";
import { mapApiPartnerWalletToUi } from "@/features/network/api/adminPartnerWallet.mapper";
import type {
  ApiV1PartnerLedgerResponse,
  ApiV1PartnerWalletResponse,
} from "@/features/network/api/adminPartnerWallet.api.types";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  PartnerWallet,
  Paginated,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type { DriverRechargePayload, DriverRechargeBatchPayload };

function resolvePartnerId(): string {
  const ownerId = useAuthStore.getState().user?.owner_id;
  if (ownerId == null || !String(ownerId).trim()) {
    throw new Error("Partenaire non identifié dans la session.");
  }
  return String(ownerId);
}

export const partnerWalletService = {
  get: async (): Promise<PartnerWallet> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<PartnerWallet>("/partner/wallet");
    }

    const partnerId = resolvePartnerId();
    const [walletRes, ledgerRes] = await Promise.all([
      apiClient.get<ApiV1PartnerWalletResponse>(
        LINKS.v1.partners.wallet(partnerId)
      ),
      apiClient.get<ApiV1PartnerLedgerResponse>(
        `${LINKS.v1.partners.ledger(partnerId)}?page=1&limit=10`
      ),
    ]);

    const wallet = mapApiPartnerWalletToUi(
      walletRes.wallet,
      ledgerRes.items ?? []
    );
    if (!wallet) {
      throw new Error("Portefeuille partenaire indisponible.");
    }
    return wallet;
  },

  withdraw: (amount_fcfa: number) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      withdrawal_id: string;
      wallet: PartnerWallet;
    }>("/partner/wallet/withdraw", { amount_fcfa }),

  getDriverRechargeStats: async (): Promise<PartnerDriverRechargeStats> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<PartnerDriverRechargeStats>(
        "/partner/wallet/driver-transfers/stats"
      );
    }

    return fetchDriverTransferStatsV1(
      LINKS.v1.partners.driverTransferStats(resolvePartnerId())
    );
  },

  listDriverTransfers: async (
    params?: ListParams
  ): Promise<Paginated<PartnerDriverTransfer>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<PartnerDriverTransfer>>(
        `/partner/wallet/driver-transfers${buildListQuery(params)}`
      );
    }

    return fetchDriverTransferListV1(
      LINKS.v1.partners.driverTransfers(resolvePartnerId()),
      params
    );
  },

  rechargeDriver: async (payload: DriverRechargePayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<{
        ok: boolean;
        message: string;
        transfer: PartnerDriverTransfer;
        wallet: PartnerWallet;
        stats: PartnerDriverRechargeStats;
      }>("/partner/wallet/driver-recharge", {
        driver_id: Number(payload.driver_id) || payload.driver_id,
        amount_fcfa: payload.amount_fcfa,
        note: payload.note,
      });
    }

    const result = await postDriverRechargeV1(
      LINKS.v1.partners.driverRecharge(resolvePartnerId()),
      payload
    );
    const wallet = await partnerWalletService.get();
    const stats = await partnerWalletService.getDriverRechargeStats();
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
      wallet,
      stats,
    };
  },

  rechargeDrivers: async (batch: DriverRechargeBatchPayload) => {
    if (useLegacyPortalApi()) {
      let last:
        | {
            ok: boolean;
            message: string;
            transfer: PartnerDriverTransfer;
            wallet: PartnerWallet;
            stats: PartnerDriverRechargeStats;
          }
        | undefined;
      for (const driver_id of batch.driver_ids) {
        last = await partnerWalletService.rechargeDriver({
          driver_id,
          amount_fcfa: batch.amount_fcfa,
          note: batch.note,
        });
      }
      if (!last) throw new Error("Aucun chauffeur sélectionné.");
      return last;
    }

    const result = await postDriverRechargeBatchV1(
      LINKS.v1.partners.driverRecharge(resolvePartnerId()),
      batch
    );
    const wallet = await partnerWalletService.get();
    const stats = await partnerWalletService.getDriverRechargeStats();
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
      wallet,
      stats,
    };
  },
};
