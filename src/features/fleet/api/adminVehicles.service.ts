import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated, Vehicle, VehicleDetail } from "@/shared/types";
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
          return assignDriverV1(vehicleId, driver, vehicle);
        },
      }
    );
  },
};
