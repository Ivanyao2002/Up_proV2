import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS, createUrl } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { FranchiseDetail } from "@/shared/types";
import type {
  ApiV1FranchiseDetailResponse,
  ApiV1FranchiseDriversResponse,
  ApiV1FranchisePartnersResponse,
  ApiV1FranchiseRevenueResponse,
} from "./adminFranchises.api.types";
import { mapV1FranchiseDetail } from "./adminFranchises.mapper";
import { zonesService } from "./zones.service";

export const franchiseDetailService = {
  getById: async (id: string | number): Promise<FranchiseDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<FranchiseDetail>(`/admin/network/franchises/${id}`);
    }

    const franchiseId = String(id);
    const lookups = await fetchNetworkLookups();

    const [profile, partners, drivers, revenue, franchiseZones] =
      await Promise.all([
        apiClient.get<ApiV1FranchiseDetailResponse>(
          LINKS.admin.franchises.getById(franchiseId)
        ),
        apiClient.get<ApiV1FranchisePartnersResponse>(
          createUrl(LINKS.admin.v1.partners, { franchiseId })
        ),
        apiClient.get<ApiV1FranchiseDriversResponse>(
          createUrl(LINKS.admin.v1.drivers, { franchiseId })
        ),
        apiClient.get<ApiV1FranchiseRevenueResponse>(
          createUrl(LINKS.admin.v1.orders, { franchiseId, report: 'revenue' })
        ),
        zonesService.listByFranchise(franchiseId),
      ]);

    return mapV1FranchiseDetail(
      profile,
      partners,
      drivers,
      revenue,
      lookups,
      franchiseZones
    );
  },
};
