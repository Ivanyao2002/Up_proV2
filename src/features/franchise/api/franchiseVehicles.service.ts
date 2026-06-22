import { apiClient } from "@/core/http/apiClient";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { ApiAdminVehiclesListResponse } from "@/features/fleet/api/adminVehicles.api.types";
import { mapAdminVehiclesToPaginated } from "@/features/fleet/api/adminVehicles.mapper";
import type { AdminVehicleDetail, Paginated, Vehicle } from "@/shared/types";
import { type ListParams } from "@/shared/types/listParams";

export interface FranchiseVehicleFilters extends ListParams {
  status?: string;
  partner_id?: string | number;
  approval_status?: string;
}

export const franchiseVehiclesService = {
  list: async (params?: FranchiseVehicleFilters): Promise<Paginated<Vehicle>> => {
    const franchiseId = await resolveFranchiseId();
    const res = await apiClient.get<ApiAdminVehiclesListResponse>(
      appendQuery(LINKS.franchise.fleet.vehicles.listV1(franchiseId), buildV1ListQuery(params))
    );
    const items = res.items ?? [];
    return mapAdminVehiclesToPaginated(items, params, res.pagination);
  },

  getById: async (id: string | number): Promise<AdminVehicleDetail> => {
    const franchiseId = await resolveFranchiseId();
    const raw = await apiClient.get<Record<string, any>>(
      LINKS.franchise.fleet.vehicles.detailV1(franchiseId, id)
    );
    const v = raw.vehicle ?? raw;
    const documents: AdminVehicleDetail["documents"] = (v.documents ?? []).map((doc: any) => ({
      id: doc.id,
      type: doc.document_type_code?.toLowerCase() ?? doc.type ?? "other",
      label: doc.document_type_label ?? doc.label ?? "Document",
      status: doc.status ?? "pending",
      uploaded_at: doc.uploaded_at ?? doc.submitted_at ?? doc.created_at ?? null,
      reviewed_at: doc.reviewed_at ?? null,
      file_url: doc.file_url ?? doc.file_download_url ?? null,
      file_urls: doc.file_urls ?? (doc.file_url ? [doc.file_url] : []),
      rejection_reason: doc.rejection_reason ?? null,
    }));
    return {
      id: v.id,
      label: [v.brand?.label, v.model?.label].filter(Boolean).join(" ") || v.plate_number || `Véhicule ${String(v.id).slice(0, 8)}`,
      plate: v.plate_number?.trim() ?? "",
      brand: v.brand?.label ?? v.brandLabel ?? "",
      model: v.model?.label ?? v.modelLabel ?? "",
      color: v.color?.label ?? "—",
      category: v.category?.code?.toLowerCase() ?? "taxi",
      category_code: v.category?.code ?? undefined,
      category_label: v.category?.label ?? "—",
      year: v.manufacture_year ?? 0,
      seats: v.seats_count ?? 0,
      approval_status: v.status === "approved" ? "approved" : v.status === "rejected" ? "rejected" : v.status === "draft" ? "draft" : "pending",
      approved_at: v.approved_at ?? null,
      created_at: v.created_at ?? new Date().toISOString(),
      updated_at: v.updated_at ?? undefined,
      partner_id: v.partner_id ?? null,
      partner_name: v.partner?.tradeName ?? v.partner?.trade_name ?? v.partner_name ?? v.partnerName ?? null,
      driver_id: v.driver?.id ?? v.driver_id ?? null,
      driver_name: v.driver?.displayName ?? ([v.driver?.profile?.firstName, v.driver?.profile?.lastName].filter(Boolean).join(" ") || null),
      vin: v.vin ?? null,
      owner_id: v.partner_id ?? "",
      registration_document: documents[0] ?? { id: "pending", type: "registration", label: "Carte grise", status: "pending", uploaded_at: v.created_at ?? new Date().toISOString(), reviewed_at: null },
      documents,
    };
  },

  approve: async (id: string | number, notes?: string): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.post(LINKS.franchise.fleet.vehicles.approveV1(franchiseId, id), {
      notes: notes || undefined,
    });
  },

  reject: async (id: string | number, reason?: string): Promise<void> => {
    const franchiseId = await resolveFranchiseId();
    await apiClient.post(LINKS.franchise.fleet.vehicles.rejectV1(franchiseId, id), {
      reason: reason || undefined,
    });
  },

  delete: async (id: string | number): Promise<void> => {
    await apiClient.delete(LINKS.franchise.fleet.vehicles.byId(id));
  },

  create: async (payload: any): Promise<any> => {
    const franchiseId = await resolveFranchiseId();
    return apiClient.post(LINKS.franchise.fleet.vehicles.listV1(franchiseId), payload);
  },
};
