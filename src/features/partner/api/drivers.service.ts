import { apiClient } from "@/core/http/apiClient";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { LINKS } from "@/core/api/links";
import {
  createDriverViaV1,
  createDriverWithDocumentsViaV1,
  type CreateDriverV1Context,
} from "@/features/fleet/api/partnerDrivers.v1.service";
import { mapAdminDriversToPaginated } from "@/features/fleet/api/adminDrivers.mapper";
import type { ApiAdminDriversResponse } from "@/features/fleet/api/adminDrivers.api.types";
import { useAuthStore } from "@/core/auth/authStore";
import type { Driver, DriverDetail, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { DriverDocumentFile, DriverKycDocumentType } from "@/shared/types/driverDocuments";
import { attachPartnerDriverDocument } from "@/features/fleet/api/kycDocumentUpload.v1.service";
import { mapDriverDocumentTypeToApiCode } from "@/features/fleet/api/documentTypeCodes.v1";

export interface CreateDriverPayload {
  first_name: string;
  last_name: string;
  phone: string;
  zone: string;
  email?: string;
}

function resolvePartnerIdForDrivers(): string | undefined {
  const ownerId = useAuthStore.getState().user?.owner_id;
  if (ownerId == null || !String(ownerId).trim()) return undefined;
  return String(ownerId);
}

function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\s/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+225${digits.slice(1)}`;
  return `+225${digits}`;
}

export const partnerDriversService = {
  list: async (params?: ListParams) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<Driver>>(
        `/partner/drivers${buildListQuery(params)}`
      );
    }

    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      return { data: [], meta: { total: 0, per_page: 25, current_page: 1, last_page: 1 } };
    }

    const response = await apiClient.get<ApiAdminDriversResponse>(
      `${LINKS.v1.partners.drivers(partnerId)}${buildV1ListQuery(params)}`
    );
    return mapAdminDriversToPaginated(
      response.items ?? [],
      params,
      response.pagination
    );
  },

  getById: async (id: string) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<DriverDetail>(`/partner/drivers/${id}`);
    }
    return apiClient.get<DriverDetail>(LINKS.v1.drivers.getById(id));
  },

  create: (data: CreateDriverPayload, context?: CreateDriverV1Context) => {
    const normalized = { ...data, phone: normalizePhoneE164(data.phone) };
    if (useLegacyPortalApi() && !context?.partnerId) {
      return apiClient.post<DriverDetail>("/partner/drivers", normalized);
    }
    return createDriverViaV1(normalized, {
      partnerId: context?.partnerId ?? resolvePartnerIdForDrivers(),
      rideCategoryCode: context?.rideCategoryCode,
    });
  },

  uploadDocument: async (
    driverId: number | string,
    type: DriverKycDocumentType,
    file: File
  ) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<DriverDetail>(
        `/partner/drivers/${driverId}/documents`,
        { type, filename: file.name }
      );
    }

    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      throw new Error("Partenaire introuvable pour l'envoi du document.");
    }

    await attachPartnerDriverDocument(
      partnerId,
      String(driverId),
      file,
      mapDriverDocumentTypeToApiCode(type)
    );

    return partnerDriversService.getById(String(driverId));
  },

  createWithDocuments: async (
    data: CreateDriverPayload,
    documents: DriverDocumentFile[] = [],
    context?: CreateDriverV1Context
  ): Promise<DriverDetail> => {
    if (useLegacyPortalApi() && !context?.partnerId) {
      const driver = await apiClient.post<DriverDetail>("/partner/drivers", data);
      let current = driver;
      for (const doc of documents) {
        current = await apiClient.post<DriverDetail>(
          `/partner/drivers/${driver.id}/documents`,
          { type: doc.type, filename: doc.file.name }
        );
      }
      return current;
    }

    return createDriverWithDocumentsViaV1(data, documents, {
      partnerId: context?.partnerId ?? resolvePartnerIdForDrivers(),
      rideCategoryCode: context?.rideCategoryCode,
      phoneVerified: context?.phoneVerified,
    });
  },
};
