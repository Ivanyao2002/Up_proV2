import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { mapAdminDriversToPaginated } from "@/features/fleet/api/adminDrivers.mapper";
import type { ApiAdminDriversResponse } from "@/features/fleet/api/adminDrivers.api.types";
import { mapApiPartnerWalletToUi } from "@/features/network/api/adminPartnerWallet.mapper";
import type { ApiV1PartnerWalletResponse } from "@/features/network/api/adminPartnerWallet.api.types";
import {
  postDriverRechargeBatchV1,
  type DriverRechargeBatchPayload,
} from "./driverRecharge.v1.service";

export async function fetchPartnerWalletAvailableFcfa(
  partnerId: string
): Promise<number> {
  const response = await apiClient.get<ApiV1PartnerWalletResponse>(
    LINKS.v1.partners.wallet(partnerId)
  );
  const wallet = mapApiPartnerWalletToUi(response.wallet);
  return wallet?.available_fcfa ?? 0;
}

export async function fetchPartnerDriversForRecharge(
  partnerId: string,
  params?: { page?: number; per_page?: number }
) {
  const response = await apiClient.get<ApiAdminDriversResponse>(
    `${LINKS.v1.partners.drivers(partnerId)}${buildV1ListQuery({
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 100,
      account_status: "approved",
    })}`
  );
  return mapAdminDriversToPaginated(
    response.items ?? [],
    { page: 1, per_page: 100, account_status: "approved" },
    response.pagination
  );
}

export async function rechargeDriversViaPartner(
  partnerId: string,
  batch: DriverRechargeBatchPayload
) {
  return postDriverRechargeBatchV1(
    LINKS.v1.partners.driverRecharge(partnerId),
    batch
  );
}
