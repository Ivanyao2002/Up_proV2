import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { fetchAdminKycDocuments } from "@/features/fleet/api/kyc.service";
import type { ApiAdminDriverItem } from "@/features/fleet/api/adminDrivers.api.types";
import type { Driver, DriverDetail, KycQueueItem, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiV1FranchiseDriversResponse } from "@/features/network/api/adminFranchises.api.types";
import { mapFranchiseDriversToPaginated } from "./franchisePortal.mapper";

export const franchiseDriversService = {
  list: async (params?: ListParams): Promise<Paginated<Driver>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<Driver>>(
        `${LINKS.franchise.drivers.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.get<ApiV1FranchiseDriversResponse>(
      appendQuery(
        LINKS.franchise.v1.drivers,
        buildV1ListQuery(params)
      )
    );
    const items = (response.items ?? []) as ApiAdminDriverItem[];
    return mapFranchiseDriversToPaginated(items, params, response.pagination);
  },

  kycQueue: async (params?: ListParams): Promise<Paginated<KycQueueItem>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<KycQueueItem>>(
        `${LINKS.franchise.drivers.kycQueue.list}${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<{
      status?: string;
      items?: Record<string, any>[];
      pagination?: { total?: number; page?: number; per_page?: number; total_pages?: number };
    }>(appendQuery(LINKS.franchise.v1.kycModeration, buildV1ListQuery(params)));

    const mapped: KycQueueItem[] = (response.items ?? []).map((item) => {
      const d = item.driver ?? {};
      return {
        driver_id: item.driverId ?? item.driver_id ?? d.id ?? "",
        first_name: item.firstName ?? item.first_name ?? d.firstName ?? "",
        last_name: item.lastName ?? item.last_name ?? d.lastName ?? "",
        phone: item.phone ?? d.phone ?? d.profile?.phone ?? "",
        zone: item.zoneName ?? item.zone ?? d.zoneName ?? d.metadata?.zone ?? "",
        owner_name: item.partnerName ?? item.partner_name ?? d.partnerName ?? d.partner_name ?? "",
        documents_pending: item.documentsPending ?? item.documents_pending ?? d.documentsSummary?.pendingCount ?? 0,
        documents_rejected: item.documentsRejected ?? item.documents_rejected ?? d.documentsSummary?.rejectedCount ?? 0,
        submitted_at: item.submittedAt ?? item.submitted_at ?? null,
        waiting_hours: item.waitingHours ?? item.waiting_hours ?? 0,
        email: item.email ?? d.profile?.email ?? null,
        kyc_status: item.kycStatus ?? item.kyc_status ?? d.kyc_status ?? "pending",
        approval_status: item.approvalStatus ?? item.approval_status ?? d.approval_status ?? "pending",
        ride_category_code: item.rideCategoryCode ?? item.ride_category_code ?? d.ride_category_code ?? null,
        compliance_status: item.complianceStatus ?? item.compliance_status ?? d.complianceStatus ?? null,
        is_online: item.isOnline ?? item.is_online ?? d.is_online ?? false,
        wallet_balance_xof: item.walletBalanceXof ?? d.wallet_balance_xof ?? 0,
        trips_count: item.tripsCount ?? d.trips_count ?? 0,
        driver: d.id ? {
          id: d.id,
          partner_id: d.partner_id ?? null,
          driver_code: d.driver_code ?? null,
          approval_status: d.approval_status ?? "pending",
          kyc_status: d.kyc_status ?? "pending",
          ride_category_code: d.ride_category_code ?? null,
          rating_avg: d.rating_avg ?? null,
          total_completed_orders: d.total_completed_orders ?? 0,
          last_online_at: d.last_online_at ?? null,
          current_vehicle_id: d.current_vehicle_id ?? null,
          is_online: d.is_online ?? false,
          wallet_balance_xof: d.wallet_balance_xof ?? 0,
          trips_count: d.trips_count ?? 0,
          complianceStatus: d.complianceStatus ?? null,
          documentsSummary: d.documentsSummary ?? null,
          vehicleSummary: d.vehicleSummary ?? null,
          profile: d.profile ?? null,
        } : undefined,
      };
    });

    return {
      data: mapped,
      meta: {
        total: response.pagination?.total ?? mapped.length,
        current_page: response.pagination?.page ?? params?.page ?? 1,
        per_page: response.pagination?.per_page ?? params?.per_page ?? 20,
        last_page: response.pagination?.total_pages ?? 1,
      },
    };
  },

  getById: async (id: string): Promise<DriverDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<DriverDetail>(`${LINKS.franchise.drivers.getById(id)}`);
    }

    const franchiseId = await resolveFranchiseId();
    
    // Try V1 franchise endpoint first (if it exists)
    try {
      const response = await apiClient.get<{ status: string; driver: DriverDetail }>(LINKS.franchise.v1.driverById(franchiseId, id));
      console.log("V1 driver detail response:", response);
      // Extract driver from response and ensure kyc_documents is always an array
      const driver = response.driver;
      return {
        ...driver,
        kyc_documents: driver.kyc_documents || [],
      };
    } catch (err) {
      console.log("V1 endpoint failed:", err);
      // V1 endpoint doesn't exist, continue to fallback
    }
    
    // Fallback 1: Get driver from franchise list (which we know works)
    try {
      const driverList = await franchiseDriversService.list({ page: 1, per_page: 500 });
      const driverFromList = driverList.data.find((d) => String(d.id) === id);
      
      if (driverFromList) {
        // Fetch KYC documents for this driver
        let kycDocuments: DriverDetail["kyc_documents"] = [];
        try {
          const kycDocs = await fetchAdminKycDocuments({ subject_id: id, subject_type: "DRIVER" });
          const { mapApiKycItemsForDriver } = await import("@/features/fleet/api/kycDocument.mapper");
          kycDocuments = mapApiKycItemsForDriver(kycDocs, id);
        } catch {
          // KYC fetch failed, continue with empty documents
        }
        
        // Map to DriverDetail with defaults for missing fields
        return {
          ...driverFromList,
          rating: driverFromList.rating ?? 0,
          registered_at: new Date().toISOString(),
          approved_at: null,
          stats: {
            trips_total: 0,
            trips_completed: 0,
            trips_cancelled: 0,
            acceptance_rate_pct: 0,
            wallet_balance_fcfa: 0,
          },
          timeline: [],
          kyc_documents: kycDocuments,
        } as DriverDetail;
      }
    } catch {
      // List failed too, continue to next fallback
    }
    
    // Fallback 2: Try global driver detail service
    try {
      const { driverDetailService } = await import("@/features/fleet/api/driverDetail.service");
      const driverDetail = await driverDetailService.getById(id);
      
      // Verify driver belongs to franchise
      const driverFranchiseId = driverDetail.franchise_id;
      if (driverFranchiseId && String(driverFranchiseId) !== String(franchiseId)) {
        throw new ApiError(404, { message: "Chauffeur introuvable dans ce territoire", code: "DRIVER_NOT_IN_FRANCHISE" });
      }
      
      // Ensure kyc_documents is always an array
      return {
        ...driverDetail,
        kyc_documents: driverDetail.kyc_documents || [],
      };
    } catch {
      // Final fallback failed
      throw new ApiError(404, { message: "Chauffeur introuvable", code: "DRIVER_NOT_FOUND" });
    }
  },

  approveKyc: (id: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.kycApprove(id)
        : `/v1/admin/drivers/${id}/approve`
    ),

  rejectKyc: (id: string, reason: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.kycReject(id)
        : `/v1/admin/drivers/${id}/reject`,
      { reason }
    ),

  approveDocument: (driverId: string, docId: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.documentApprove(driverId, docId)
        : LINKS.admin.v1.kycApprove(docId)
    ),

  rejectDocument: (driverId: string, docId: string, reason: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.documentReject(driverId, docId)
        : LINKS.admin.v1.kycReject(docId),
      { reason }
    ),

  create: async (payload: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    ride_category_code?: string;
    partner_id?: string;
    accepts_cash?: boolean;
    accepts_wallet?: boolean;
  }): Promise<DriverDetail> => {
    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.post<{ status: string; driver: DriverDetail }>(
      `/v1/franchises/${franchiseId}/drivers`,
      payload
    );
    return { ...response.driver, kyc_documents: response.driver.kyc_documents ?? [] };
  },

  suspend: async (id: string, reason?: string): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.post(
      `${LINKS.franchise.v1.driverById(franchiseId, id)}/suspend`,
      reason ? { reason } : undefined
    );
  },

  unsuspend: async (id: string): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.post(
      `${LINKS.franchise.v1.driverById(franchiseId, id)}/activate`
    );
  },

  update: async (
    id: string,
    payload: { first_name?: string; last_name?: string; phone?: string; email?: string; ride_category_code?: string; accepts_cash?: boolean; accepts_wallet?: boolean }
  ): Promise<DriverDetail> => {
    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.patch<{ status: string; driver: DriverDetail }>(
      LINKS.franchise.v1.driverById(franchiseId, id),
      payload
    );
    return { ...response.driver, kyc_documents: response.driver.kyc_documents ?? [] };
  },

  delete: async (id: string): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.delete(LINKS.franchise.v1.driverById(franchiseId, id));
  },

  setAvailability: async (id: string, availability: "online" | "offline"): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.patch(LINKS.franchise.v1.driverById(franchiseId, id), {
      availability_status: availability,
      availability,
    });
  },
};
