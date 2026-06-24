import { apiClient } from "@/core/http/apiClient";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { LINKS } from "@/core/api/links";
import {
  createDriverViaV1,
  createDriverWithDocumentsViaV1,
  type CreateDriverV1Context,
} from "@/features/fleet/api/partnerDrivers.v1.service";
import {
  mapAdminDriversToPaginated,
  normalizeDriverAccountStatus,
  normalizeDriverAvailability,
} from "@/features/fleet/api/adminDrivers.mapper";
import type {
  ApiAdminDriversResponse,
  ApiAdminDriversCounters,
} from "@/features/fleet/api/adminDrivers.api.types";
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

export interface PartnerDriversListResult extends Paginated<Driver> {
  counters?: ApiAdminDriversCounters;
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
  list: async (params?: ListParams): Promise<PartnerDriversListResult> => {
    if (useLegacyPortalApi()) {
      const legacy = await apiClient.get<Paginated<Driver>>(
        `/partner/drivers${buildListQuery(params)}`
      );
      return { ...legacy, counters: undefined };
    }

    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      return {
        data: [],
        meta: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
        counters: undefined,
      };
    }

    const response = await apiClient.get<ApiAdminDriversResponse>(
      `${LINKS.v1.partners.drivers(partnerId)}${buildV1ListQuery(params)}`
    );
    const paginated = mapAdminDriversToPaginated(
      response.items ?? [],
      params,
      response.pagination
    );
    // Compteurs flotte fournis directement par l'API (évite des requêtes d'agrégation séparées).
    return { ...paginated, counters: response.counters };
  },

  getById: async (id: string) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<DriverDetail>(`/partner/drivers/${id}`);
    }
    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      return apiClient.get<DriverDetail>(LINKS.v1.drivers.getById(id));
    }

    const raw = await apiClient.get<{
      status?: string;
      driver?: Record<string, unknown>;
      profile?: {
        firstName?: string | null;
        first_name?: string | null;
        lastName?: string | null;
        last_name?: string | null;
        displayName?: string | null;
        display_name?: string | null;
        phone?: string | null;
        email?: string | null;
        avatarUrl?: string | null;
        photo_url?: string | null;
        cityId?: string | null;
      };
      wallet?: {
        balance_fcfa?: number;
        balance_cached_xof?: number;
        balanceCachedXof?: number;
        withdrawableBalanceXof?: number;
        withdrawable_balance_xof?: number;
        nonWithdrawableBalanceXof?: number;
        non_withdrawable_balance_xof?: number;
        availableXof?: number;
        available_xof?: number;
        pendingWithdrawalXof?: number;
      };
      summary?: {
        name?: string | null;
        driverCode?: string | null;
        rating?: number | null;
        ratingAvg?: number | null;
        vehicle?: string | null;
      };
      performance?: {
        ratingAvg?: number | null;
        ratingCount?: number;
        cancellationRate?: number | null;
        acceptanceRate?: number | null;
        acceptance_rate_pct?: number | null;
        reliabilityScore?: number | null;
        totalCompletedOrders?: number;
        trips_completed?: number;
      };
      vehicleLabel?: string | null;
      zoneName?: string | null;
    }>(LINKS.partner.drivers.getById(partnerId, id));

    const d = raw.driver ?? {};
    // Le profil peut être imbriqué dans driver.profile ou au niveau racine
    const p = (d.profile as typeof raw.profile) ?? raw.profile ?? {};
    const w = (d.wallet as typeof raw.wallet) ?? raw.wallet;
    const perf = raw.performance ?? {};

    const walletBalance =
      (d.wallet_balance_xof as number | null) ??
      w?.balance_fcfa ??
      w?.balance_cached_xof ??
      w?.balanceCachedXof ??
      (w?.withdrawable_balance_xof != null && w?.non_withdrawable_balance_xof != null
        ? (w.withdrawable_balance_xof + w.non_withdrawable_balance_xof)
        : undefined) ??
      0;

    const walletWithdrawable =
      w?.withdrawable_balance_xof ??
      w?.withdrawableBalanceXof ??
      null;

    const walletNonWithdrawable =
      w?.non_withdrawable_balance_xof ??
      w?.nonWithdrawableBalanceXof ??
      null;

    const ratingAvg =
      (d.rating_avg as number | null) ??
      perf.ratingAvg ??
      null;

    const cancellationRate =
      (d.cancellation_rate as number | null) ??
      perf.cancellationRate ??
      null;

    return {
      id: (d.id as string) ?? id,
      user_id: (d.user_id as string) ?? undefined,
      partner_id: (d.partner_id as string) ?? undefined,
      driver_code: (d.driver_code as string | null) ?? null,
      first_name:
        (p.firstName as string | null) ??
        (p.first_name as string | null) ??
        (p.display_name as string | null) ??
        (d.displayName as string | null) ??
        null,
      last_name:
        (p.lastName as string | null) ??
        (p.last_name as string | null) ??
        null,
      phone:
        (p.phone as string | null) ??
        (d.phone as string | null) ??
        null,
      email:
        (p.email as string | null) ??
        (d.email as string | null) ??
        null,
      photo_url:
        (p.avatarUrl as string | null) ??
        (p.photo_url as string | null) ??
        null,
      account_status: normalizeDriverAccountStatus(
        d.account_status as string | null,
        d.approval_status as string | null
      ),
      availability: normalizeDriverAvailability(
        d.availability_status as string | null
      ),
      kyc_status: (d.kyc_status as string) ?? null,
      approval_status: (d.approval_status as string) ?? null,
      onboarding_status: (d.onboarding_status as string) ?? null,
      ride_category_code: (d.ride_category_code as string) ?? null,
      rating_avg: ratingAvg,
      rating_count: (d.rating_count as number) ?? perf.ratingCount ?? 0,
      cancellation_rate: cancellationRate,
      reliability_score: (d.reliability_score as number | null) ?? perf.reliabilityScore ?? null,
      total_completed_orders: (d.total_completed_orders as number) ?? perf.totalCompletedOrders ?? 0,
      rating:
        ratingAvg ??
        raw.summary?.ratingAvg ??
        raw.summary?.rating ??
        null,
      accepts_cash: (d.accepts_cash as boolean) ?? true,
      accepts_wallet: (d.accepts_wallet as boolean) ?? true,
      last_online_at: (d.last_online_at as string | null) ?? null,
      vehicle_id:
        (d.current_vehicle_id as string | null) ??
        (d.vehicle as Record<string, unknown>)?.id as string | null ??
        null,
      current_vehicle_id:
        (d.current_vehicle_id as string | null) ?? null,
      vehicle_label:
        raw.vehicleLabel ??
        (() => {
          const v = d.vehicle as Record<string, unknown> | null | undefined;
          if (!v) return null;
          const brand = (v.brand as string) ?? (v.brand as Record<string, unknown>)?.name ?? (v.brandLabel as string) ?? "";
          const model = (v.model as string) ?? (v.model as Record<string, unknown>)?.name ?? (v.modelLabel as string) ?? "";
          const plate = (v.plate_number as string) ?? "";
          return [brand, model].filter(Boolean).join(" ") || plate || null;
        })() ??
        null,
      zone: raw.zoneName ?? null,
      license_number:
        ((d.metadata as Record<string, unknown> | undefined)?.license as
          | Record<string, unknown>
          | undefined)?.number as string | undefined ?? null,
      license_expires_at:
        (() => {
          const lic = (d.metadata as Record<string, unknown> | undefined)
            ?.license as Record<string, unknown> | undefined;
          return (lic?.expiresAt as string) ?? (lic?.expires_at as string) ?? null;
        })(),
      registered_at:
        (d.created_at as string) ?? new Date().toISOString(),
      approved_at: null,
      wallet_balance_xof:
        (d.wallet_balance_xof as number | null) ?? walletBalance,
      trips_count:
        (d.trips_count as number | null) ?? perf.totalCompletedOrders ?? 0,
      kyc_documents: (() => {
        const docs = d.kyc_documents as unknown[];
        if (!Array.isArray(docs) || docs.length === 0) return [];
        return docs.map((doc) => {
          const dc = doc as Record<string, unknown>;
          return {
            id: (dc.id as string) ?? "",
            type: ((dc.document_group as string) ?? "cni").toLowerCase() as "cni" | "license" | "registration" | "selfie",
            label: (dc.document_type_label as string) ?? (dc.document_type_code as string) ?? "",
            status: ((dc.status as string) ?? "pending") as "pending" | "approved" | "rejected",
            status_note: (dc.rejection_reason as string) ?? undefined,
            uploaded_at: (dc.uploaded_at as string) ?? (dc.submitted_at as string) ?? "",
            reviewed_at: (dc.reviewed_at as string | null) ?? null,
            preview_url: (dc.file_url as string) ?? undefined,
            document_type_code: (dc.document_type_code as string) ?? undefined,
            document_group: (dc.document_group as string) ?? undefined,
            document_side: (dc.document_side as string) ?? undefined,
          };
        });
      })(),
      timeline: [],
      stats: {
        trips_total:
          (d.trips_count as number | null) ??
          (d.total_completed_orders as number | null) ??
          perf.totalCompletedOrders ?? 0,
        trips_completed:
          (d.total_completed_orders as number | null) ??
          perf.totalCompletedOrders ?? perf.trips_completed ?? 0,
        trips_cancelled: 0,
        acceptance_rate_pct:
          (d.acceptance_rate_pct as number | null) ??
          perf.acceptanceRate ??
          (perf.acceptance_rate_pct as number | null) ??
          null,
        wallet_balance_fcfa: walletBalance,
        wallet_withdrawable_fcfa: walletWithdrawable,
        wallet_non_withdrawable_fcfa: walletNonWithdrawable,
      },
    } as DriverDetail;
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

  update: async (
    driverId: string,
    data: Partial<CreateDriverPayload>
  ): Promise<DriverDetail> => {
    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      throw new Error("Partenaire introuvable.");
    }

    const body: Record<string, string | undefined> = {
      firstName: data.first_name?.trim(),
      lastName: data.last_name?.trim(),
      phone: data.phone ? normalizePhoneE164(data.phone) : undefined,
      email: data.email?.trim(),
      zone: data.zone?.trim(),
    };

    await apiClient.patch(
      LINKS.partner.drivers.getById(partnerId, driverId),
      body
    );

    return partnerDriversService.getById(driverId);
  },

  setAvailability: async (
    driverId: string,
    availability: "online" | "offline"
  ): Promise<void> => {
    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      throw new Error("Partenaire introuvable.");
    }

    await apiClient.patch(LINKS.partner.drivers.getById(partnerId, driverId), {
      availability_status: availability,
      availability,
    });
  },

  suspend: async (driverId: string): Promise<void> => {
    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      throw new Error("Partenaire introuvable.");
    }

    await apiClient.patch(LINKS.partner.drivers.getById(partnerId, driverId), {
      account_status: "suspended",
      approval_status: "suspended",
    });
  },

  reactivate: async (driverId: string): Promise<void> => {
    const partnerId = resolvePartnerIdForDrivers();
    if (!partnerId) {
      throw new Error("Partenaire introuvable.");
    }

    await apiClient.patch(LINKS.partner.drivers.getById(partnerId, driverId), {
      account_status: "active",
      approval_status: "approved",
    });
  },

};
