import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { env } from "@/core/config/env";
import { LINKS } from "@/core/api/links";
import type {
  DriverDetail,
  Paginated,
  TripMatchingOutcome,
  TripStatus,
} from "@/shared/types";
import {
  fetchAdminOrdersList,
  resolveAdminDriver,
} from "@/features/admin/api/adminEntityLookup.service";
import {
  mapApiOrderStatus,
  orderRef,
} from "@/features/admin/api/adminOrder.shared";
import type { ApiAdminOrdersResponse } from "@/features/ops/api/adminOrders.api.types";
import type { ApiAdminDriversResponse } from "./adminDrivers.api.types";
import type { ApiV1DriverDetailResponse } from "./driverDetail.v1.api.types";
import {
  mapAdminDriverItemToDetail,
  mapApiV1DriverDetailToDriverDetail,
  mapLiveMapDriverToDetail,
} from "./driverDetail.mapper";
import { fetchAdminKycDocuments } from "./kyc.service";
import type { ApiV1PartnerDetailResponse } from "@/features/network/api/adminPartnerDetail.api.types";
import {
  mapApiKycItemsForDriver,
  mergeExpectedDriverKycSlots,
} from "./kycDocument.mapper";
import type {
  ApiDriverLedgerResponse,
  ApiDriverWalletResponse,
} from "./driverWallet.api.types";
import {
  activateDriverAccount,
  setDriverAvailability,
  suspendDriverAccount,
  type DriverAvailabilityAction,
} from "./driverAdminActions.service";

export interface DriverTripRow {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
  offer_outcome?: TripMatchingOutcome;
}

export interface DriverWalletTransaction {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount_fcfa: number;
  balance_after_fcfa: number;
  created_at: string;
}

function useLegacyDriverDetail(): boolean {
  return env.useMocks && !env.useRealAuth;
}

function mapOrdersToDriverTrips(
  driverId: string,
  orders: ApiAdminOrdersResponse
): Paginated<DriverTripRow> {
  const all = [...(orders.rides ?? []), ...(orders.deliveries ?? [])].filter(
    (o) => o.driver_id === driverId
  );
  const data: DriverTripRow[] = all.slice(0, 50).map((o) => ({
    id: o.id,
    ref: orderRef(o),
    from_label: o.pickup_address ?? "—",
    to_label: o.dropoff_address ?? "—",
    status: mapApiOrderStatus(o.status),
    amount_fcfa: o.final_price_xof ?? o.estimated_price_xof ?? 0,
    created_at: o.created_at ?? new Date().toISOString(),
  }));
  return {
    data,
    meta: {
      total: data.length,
      per_page: 50,
      current_page: 1,
      last_page: 1,
    },
  };
}

async function enrichDriverPartnerName(
  detail: DriverDetail
): Promise<DriverDetail> {
  if (detail.owner_name?.trim()) return detail;
  const partnerId = detail.owner_id;
  if (!partnerId) return detail;

  try {
    const response = await apiClient.get<ApiV1PartnerDetailResponse>(
      LINKS.admin.partners.getById(String(partnerId))
    );
    const partner = response.partner;
    const name =
      partner.name?.trim() ||
      partner.trade_name?.trim() ||
      partner.legal_name?.trim();
    if (name) return { ...detail, owner_name: name };
  } catch {
    // Partenaire introuvable — garder le détail sans nom
  }

  return detail;
}

function readWalletBalanceFcfa(
  wallet?: ApiDriverWalletResponse["wallet"] | null
): number {
  if (!wallet) return 0;
  return (
    wallet.availableXof ??
    wallet.available_xof ??
    wallet.balanceCachedXof ??
    wallet.balance_fcfa ??
    0
  );
}

async function attachDriverWallet(
  detail: DriverDetail,
  driverId: string
): Promise<DriverDetail> {
  if (useLegacyDriverDetail()) return detail;

  try {
    const response = await apiClient.get<ApiDriverWalletResponse>(
      LINKS.v1.drivers.wallet(driverId)
    );
    const balance = readWalletBalanceFcfa(response.wallet);
    return {
      ...detail,
      stats: {
        ...detail.stats,
        wallet_balance_fcfa: balance,
      },
    };
  } catch {
    return detail;
  }
}

function mapLedgerItemToWalletTransaction(
  item: NonNullable<ApiDriverLedgerResponse["items"]>[number]
): DriverWalletTransaction {
  const direction =
    String(item.direction ?? "credit").toLowerCase() === "debit"
      ? "debit"
      : "credit";
  return {
    id: item.id,
    type: direction,
    label: item.label ?? item.description ?? "Mouvement",
    amount_fcfa: item.amount_fcfa ?? item.amount_xof ?? item.amountXof ?? 0,
    balance_after_fcfa:
      item.balance_after_fcfa ??
      item.balance_after_xof ??
      item.balanceAfterXof ??
      0,
    created_at:
      item.created_at ?? item.posted_at ?? new Date().toISOString(),
  };
}

async function attachDriverKycDocuments(
  detail: DriverDetail,
  driverId: string
): Promise<DriverDetail> {
  const showMissingSlots = detail.account_status === "pending";
  if (detail.kyc_documents.length > 0) {
    return {
      ...detail,
      kyc_documents: mergeExpectedDriverKycSlots(detail.kyc_documents, {
        showMissingSlots,
      }),
    };
  }

  try {
    const items = await fetchAdminKycDocuments({
      subject_id: driverId,
      subject_type: "DRIVER",
    });
    const documents = mapApiKycItemsForDriver(items, driverId);
    return {
      ...detail,
      kyc_documents: mergeExpectedDriverKycSlots(documents, {
        showMissingSlots,
      }),
    };
  } catch {
    return detail;
  }
}

async function fetchDriverDetailFallback(
  id: string
): Promise<DriverDetail> {
  const driver = await resolveAdminDriver(id);
  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  if (driver.profile?.displayName || driver.profile?.phone) {
    return attachDriverKycDocuments(mapLiveMapDriverToDetail(driver), id);
  }

  const list = await apiClient.get<ApiAdminDriversResponse>(
    LINKS.admin.v1.drivers
  );
  const item = (list.items ?? []).find((d) => d.id === id);
  if (item) {
    return attachDriverKycDocuments(mapAdminDriverItemToDetail(item), id);
  }
  return attachDriverKycDocuments(mapLiveMapDriverToDetail(driver), id);
}

export const driverDetailService = {
  getById: async (id: string | number): Promise<DriverDetail> => {
    if (useLegacyDriverDetail()) {
      return apiClient.get<DriverDetail>(`/admin/drivers/${id}`);
    }

    const driverId = String(id);

    try {
      const response = await apiClient.get<ApiV1DriverDetailResponse>(
        LINKS.v1.drivers.getById(driverId)
      );
      const detail = mapApiV1DriverDetailToDriverDetail(response);
      const withPartner = await enrichDriverPartnerName(detail);
      const withKyc = await attachDriverKycDocuments(withPartner, driverId);
      return attachDriverWallet(withKyc, driverId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return fetchDriverDetailFallback(driverId);
      }
      throw error;
    }
  },

  getTrips: async (id: string | number): Promise<Paginated<DriverTripRow>> => {
    if (useLegacyDriverDetail()) {
      return apiClient.get<Paginated<DriverTripRow>>(
        `/admin/drivers/${id}/trips`
      );
    }

    const orders = await fetchAdminOrdersList();
    return mapOrdersToDriverTrips(String(id), orders);
  },

  getWalletTransactions: async (
    id: string | number
  ): Promise<Paginated<DriverWalletTransaction>> => {
    if (useLegacyDriverDetail()) {
      return apiClient.get<Paginated<DriverWalletTransaction>>(
        `/admin/drivers/${id}/wallet/transactions`
      );
    }

    const driverId = String(id);
    const response = await apiClient.get<ApiDriverLedgerResponse>(
      `${LINKS.v1.drivers.ledger(driverId)}?page=1&limit=50`
    );
    const items = response.items ?? response.transactions ?? [];
    const data = items.map(mapLedgerItemToWalletTransaction);
    const total = response.pagination?.total ?? data.length;
    return {
      data,
      meta: {
        total,
        per_page: response.pagination?.limit ?? 50,
        current_page: response.pagination?.page ?? 1,
        last_page: response.pagination?.totalPages ?? 1,
      },
    };
  },

  approveKyc: (id: string | number) =>
    useLegacyDriverDetail()
      ? apiWithNotify.post(
          `/admin/drivers/${id}/kyc/approve`,
          undefined,
          "KYC approuvé"
        )
      : apiWithNotify.post(
          LINKS.admin.v1.driverApprove(String(id)),
          undefined,
          "Compte chauffeur approuvé"
        ),

  rejectKyc: (id: string | number, reason: string) =>
    useLegacyDriverDetail()
      ? apiWithNotify.post(
          `/admin/drivers/${id}/kyc/reject`,
          { reason },
          "Document rejeté"
        )
      : apiWithNotify.post(
          LINKS.admin.v1.driverReject(String(id)),
          { reason, rejection_reason: reason },
          "Demande rejetée"
        ),

  setAvailability: async (
    id: string | number,
    availability: DriverAvailabilityAction
  ) => {
    const result = await setDriverAvailability(id, availability);
    return {
      ok: result.ok,
      message: result.message,
      driver: {} as DriverDetail,
    };
  },

  suspend: async (id: string | number) => {
    const result = await suspendDriverAccount(id);
    return {
      ok: result.ok,
      message: result.message,
      driver: {} as DriverDetail,
    };
  },

  activate: async (id: string | number) => {
    const result = await activateDriverAccount(id);
    return {
      ok: result.ok,
      message: result.message,
      driver: {} as DriverDetail,
    };
  },
};
