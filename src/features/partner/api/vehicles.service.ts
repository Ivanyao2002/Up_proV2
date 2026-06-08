import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { useAuthStore } from "@/core/auth/authStore";
import { LINKS } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";
import type { Paginated, Vehicle, VehicleDetail } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiAdminVehiclesListResponse } from "@/features/fleet/api/adminVehicles.api.types";
import {
  mapAdminVehiclesToPaginated,
  mapApiVehicleToVehicleDetail,
  mapPartnerFreeTextToApiBody,
  mapUiCategoryToApiCode,
} from "@/features/fleet/api/adminVehicles.mapper";
import type { ApiV1VehicleCreateResponse } from "@/features/fleet/api/adminVehicles.api.types";
import {
  fetchVehicleCatalogLookupsForItems,
} from "@/features/fleet/api/vehicleCatalog.service";
import {
  applyVehicleCreateFlow,
  assignDriverV1,
  legacyPartnerDocumentsPath,
} from "@/features/fleet/api/vehicleCreateFlow";
import { partnerDriversService, type CreateDriverPayload } from "./drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehiclePieceFile } from "../components/VehicleCreatePiecesSection";

export interface VehiclesListResponse extends Paginated<Vehicle> {
  summary: {
    approved: number;
    pending: number;
    rejected: number;
    draft: number;
  };
}

export interface CreateVehiclePayload {
  brand: string;
  model: string;
  year: number;
  color: string;
  category: Vehicle["category"];
  plate?: string;
}

function resolvePartnerId(): string {
  const ownerId = useAuthStore.getState().user?.owner_id;
  if (ownerId == null || !String(ownerId).trim()) {
    throw new Error("Partenaire introuvable dans la session.");
  }
  return String(ownerId);
}

function buildSummary(items: Vehicle[]): VehiclesListResponse["summary"] {
  return items.reduce(
    (acc, item) => {
      acc[item.approval_status] += 1;
      return acc;
    },
    { approved: 0, pending: 0, rejected: 0, draft: 0 }
  );
}

async function listV1(params?: ListParams): Promise<VehiclesListResponse> {
  const partnerId = resolvePartnerId();
  const response = await apiClient.get<ApiAdminVehiclesListResponse>(
    `${LINKS.v1.partners.vehicles(partnerId)}${buildV1ListQuery(params)}`
  );
  const items = response.items ?? [];
  const lookups = await fetchVehicleCatalogLookupsForItems(items);
  const paginated = mapAdminVehiclesToPaginated(
    items,
    params,
    response.pagination,
    lookups
  );
  return {
    ...paginated,
    summary: buildSummary(paginated.data),
  };
}

async function getByIdV1(id: string): Promise<VehicleDetail> {
  try {
    const response = await apiClient.get<{ vehicle?: unknown }>(
      LINKS.v1.vehicles.getById(id)
    );
    if (response.vehicle && typeof response.vehicle === "object") {
      const vehicle = response.vehicle as Parameters<typeof mapApiVehicleToVehicleDetail>[0];
      const lookups = await fetchVehicleCatalogLookupsForItems([vehicle]);
      return mapApiVehicleToVehicleDetail(vehicle, lookups);
    }
  } catch {
    // Fallback liste partenaire — GET /v1/vehicles/:id indisponible côté API
  }

  const list = await listV1({ per_page: 200 });
  const match = list.data.find((item) => String(item.id) === id);
  if (!match) {
    throw new Error("Véhicule introuvable.");
  }

  return {
    ...match,
    brand: match.label.split(" ")[0] ?? "—",
    model: match.label.split(" ").slice(1).join(" ") || "—",
    seats: 0,
    owner_id: match.partner_id ?? resolvePartnerId(),
    registration_document: {
      id: "pending",
      type: "registration",
      label: "Carte grise",
      status: "pending",
      uploaded_at: match.created_at,
      reviewed_at: null,
    },
    approved_at: null,
  };
}

async function createV1(data: CreateVehiclePayload): Promise<VehicleDetail> {
  const response = await apiClient.post<ApiV1VehicleCreateResponse>(
    LINKS.v1.vehicles.create,
    mapPartnerFreeTextToApiBody({
      partnerId: resolvePartnerId(),
      category: data.category,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      plate: data.plate,
    })
  );

  if (!response.vehicle?.id) {
    throw new Error("Création véhicule sans identifiant en réponse.");
  }

  const detail = mapApiVehicleToVehicleDetail(response.vehicle, {
    categoryById: new Map(),
    categoryByCode: new Map(),
    brandById: new Map(),
    modelById: new Map(),
    colorById: new Map(),
    partnerNameById: new Map(),
  });

  return {
    ...detail,
    label: [data.brand, data.model].filter(Boolean).join(" ").trim() || detail.label,
    brand: data.brand.trim() || detail.brand,
    model: data.model.trim() || detail.model,
    color: data.color.trim() || detail.color,
  };
}

export const partnerVehiclesService = {
  list: async (params?: ListParams) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<VehiclesListResponse>(
        `/partner/vehicles${buildListQuery(params)}`
      );
    }
    return listV1(params);
  },

  getById: async (id: string) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<VehicleDetail>(`/partner/vehicles/${id}`);
    }
    return getByIdV1(id);
  },

  create: async (data: CreateVehiclePayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<VehicleDetail>("/partner/vehicles", data);
    }
    return createV1(data);
  },

  uploadRegistration: (id: string) =>
    apiWithNotify.post<VehicleDetail>(
      useLegacyPortalApi()
        ? `/partner/vehicles/${id}/registration`
        : LINKS.v1.vehicles.getById(id),
      {},
      "Carte grise envoyée — validation en cours"
    ),

  uploadDocument: (id: string, type: VehicleDocumentType) =>
    apiClient.post<VehicleDetail>(
      useLegacyPortalApi()
        ? `/partner/vehicles/${id}/documents`
        : LINKS.v1.vehicles.getById(id),
      { type }
    ),

  assignDriver: async (
    vehicleId: number | string,
    driver: { id: string | number; first_name: string; last_name: string }
  ) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<VehicleDetail>(
        `/partner/vehicles/${vehicleId}/assign-driver`,
        {
          driver_id: driver.id,
          driver_name: `${driver.first_name} ${driver.last_name}`,
        }
      );
    }

    return apiClient.post<VehicleDetail>(
      LINKS.v1.vehicles.assignDriver(String(vehicleId)),
      {
        driverId: String(driver.id),
      }
    );
  },

  /** Création véhicule, pièces et chauffeur optionnels */
  createWithOptions: async (
    data: CreateVehiclePayload,
    options: {
      pieces?: VehiclePieceFile[];
      driver?: CreateDriverPayload | null;
      driverDocuments?: DriverDocumentFile[];
    } = {}
  ): Promise<VehicleDetail> => {
    const legacy = useLegacyPortalApi();
    const vehicle = legacy
      ? await apiClient.post<VehicleDetail>("/partner/vehicles", data)
      : await createV1(data);

    return applyVehicleCreateFlow(
      vehicle,
      {
        ...options,
        partnerId: resolvePartnerId(),
        rideCategoryCode: mapUiCategoryToApiCode(data.category),
      },
      {
        legacyDocumentsPath: legacy ? legacyPartnerDocumentsPath : undefined,
        createDriverWithDocuments: async (driver, documents, context) => {
          const created = await partnerDriversService.createWithDocuments(
            driver,
            documents,
            context
          );
          return {
            id: created.id,
            first_name: driver.first_name,
            last_name: driver.last_name,
          };
        },
        assignDriver: async (vehicleId, driver) => {
          if (legacy) {
            return apiClient.post<VehicleDetail>(
              `/partner/vehicles/${vehicleId}/assign-driver`,
              {
                driver_id: driver.id,
                driver_name: `${driver.first_name} ${driver.last_name}`,
              }
            );
          }
          return assignDriverV1(vehicleId, driver, vehicle);
        },
      }
    );
  },
};
