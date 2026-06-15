import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { AdminVehicleDetail, Paginated, Vehicle, VehicleDetail } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiAdminVehiclesListResponse,
  ApiV1VehicleCreateBody,
  ApiV1VehicleCreateResponse,
} from "./adminVehicles.api.types";
import {
  mapAdminVehiclesToPaginated,
  mapApiVehicleToVehicleDetail,
} from "./adminVehicles.mapper";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import { partnerDriversService } from "@/features/partner/api/drivers.service";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { ApiV1PartnerVehicleDetailResponse } from "./adminVehicleDetail.api.types";
import { mapPartnerVehicleDetailResponse } from "./adminVehicleDetail.mapper";
import {
  fetchVehicleCatalogLookupsForBrand,
  fetchVehicleCatalogLookupsForItems,
} from "./vehicleCatalog.service";
import {
  applyVehicleCreateFlow,
  assignDriverV1,
  legacyAdminDocumentsPath,
  type VehicleCreateFlowOptions,
} from "./vehicleCreateFlow";

export type AdminVehicleCreatePayload = ApiV1VehicleCreateBody;

export const adminVehiclesService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<Vehicle>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Vehicle>>(
        `/admin/fleet/vehicles${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiAdminVehiclesListResponse>(
      `${LINKS.admin.v1.vehicles}${buildV1ListQuery(params)}`
    );
    const items = response.items ?? [];
    const lookups = await fetchVehicleCatalogLookupsForItems(items);

    return mapAdminVehiclesToPaginated(items, params, response.pagination, lookups);
  },

  getById: async (
    vehicleId: string,
    partnerId?: string
  ): Promise<AdminVehicleDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<AdminVehicleDetail>(
        `/admin/fleet/vehicles/${vehicleId}`
      );
    }

    let resolvedPartnerId = partnerId?.trim();
    if (!resolvedPartnerId) {
      const list = await adminVehiclesService.listAdmin({ per_page: 200 });
      const match = list.data.find((item) => String(item.id) === vehicleId);
      if (!match?.partner_id) {
        throw new Error("Véhicule introuvable — partenaire manquant.");
      }
      resolvedPartnerId = String(match.partner_id);
    }

    const response = await apiClient.get<ApiV1PartnerVehicleDetailResponse>(
      LINKS.admin.partners.vehicleById(resolvedPartnerId, vehicleId)
    );

    if (!response.vehicle?.id) {
      throw new Error("Véhicule introuvable.");
    }

    const lookups = await fetchVehicleCatalogLookupsForItems([response.vehicle]);
    return mapPartnerVehicleDetailResponse(response, lookups);
  },

  create: async (payload: AdminVehicleCreatePayload): Promise<VehicleDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.post<VehicleDetail>("/admin/fleet/vehicles", payload);
    }

    const response = await apiClient.post<ApiV1VehicleCreateResponse>(
      LINKS.v1.vehicles.create,
      payload
    );

    if (!response.vehicle?.id) {
      throw new Error("Création véhicule sans identifiant en réponse.");
    }

    const lookups = await fetchVehicleCatalogLookupsForBrand(payload.brandCode);
    return mapApiVehicleToVehicleDetail(response.vehicle, lookups);
  },

  createWithOptions: async (
    payload: AdminVehicleCreatePayload,
    options: VehicleCreateFlowOptions = {}
  ): Promise<VehicleDetail> => {
    const vehicle = await adminVehiclesService.create(payload);
    const legacy = useLegacyAdminApi();

    return applyVehicleCreateFlow(
      vehicle,
      {
        ...options,
        partnerId: payload.partnerId,
        rideCategoryCode: payload.categoryCode,
      },
      {
        legacyDocumentsPath: legacy ? legacyAdminDocumentsPath : undefined,
        createDriverWithDocuments: async (driver, documents, context) => {
          const created = await partnerDriversService.createWithDocuments(
            driver,
            documents,
            context
          );
          return {
            id: created.id,
            user_id: created.user_id,
            first_name: driver.first_name,
            last_name: driver.last_name,
          };
        },
        assignDriver: async (vehicleId, driver) => {
          if (legacy) {
            return apiClient.post<VehicleDetail>(
              `/admin/fleet/vehicles/${vehicleId}/assign-driver`,
              {
                driver_id: driver.id,
                driver_name: `${driver.first_name} ${driver.last_name}`,
              }
            );
          }
          return assignDriverV1(vehicleId, driver, {
            baseVehicle: vehicle,
            partnerId: payload.partnerId,
          });
        },
      }
    );
  },

  delete: async (vehicleId: string): Promise<void> => {
    if (useLegacyAdminApi()) {
      await apiClient.delete(`/admin/fleet/vehicles/${vehicleId}`);
      return;
    }
    await apiClient.delete(LINKS.admin.v1.vehicleById(vehicleId));
  },
};
