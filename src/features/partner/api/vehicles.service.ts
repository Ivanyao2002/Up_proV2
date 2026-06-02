import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";
import type { Paginated, Vehicle, VehicleDetail } from "@/shared/types";
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

export const partnerVehiclesService = {
  list: () => apiClient.get<VehiclesListResponse>("/partner/vehicles"),

  getById: (id: string) => apiClient.get<VehicleDetail>(`/partner/vehicles/${id}`),

  create: (data: CreateVehiclePayload) =>
    apiClient.post<VehicleDetail>("/partner/vehicles", data),

  uploadRegistration: (id: string) =>
    apiWithNotify.post<VehicleDetail>(
      `/partner/vehicles/${id}/registration`,
      {},
      "Carte grise envoyée — validation en cours"
    ),

  uploadDocument: (id: string, type: VehicleDocumentType) =>
    apiClient.post<VehicleDetail>(`/partner/vehicles/${id}/documents`, { type }),

  assignDriver: (
    vehicleId: number | string,
    driver: { id: number; first_name: string; last_name: string }
  ) =>
    apiClient.post<VehicleDetail>(`/partner/vehicles/${vehicleId}/assign-driver`, {
      driver_id: driver.id,
      driver_name: `${driver.first_name} ${driver.last_name}`,
    }),

  /** Création véhicule, pièces et chauffeur optionnels */
  createWithOptions: async (
    data: CreateVehiclePayload,
    options: {
      pieces?: VehiclePieceFile[];
      driver?: CreateDriverPayload | null;
      driverDocuments?: DriverDocumentFile[];
    } = {}
  ): Promise<VehicleDetail> => {
    const { pieces = [], driver, driverDocuments = [] } = options;
    let current = await apiClient.post<VehicleDetail>("/partner/vehicles", data);

    for (const piece of pieces) {
      current = await apiClient.post<VehicleDetail>(
        `/partner/vehicles/${current.id}/documents`,
        { type: piece.type, filename: piece.file.name }
      );
    }

    if (driver) {
      const createdDriver = await partnerDriversService.createWithDocuments(
        driver,
        driverDocuments
      );
      current = await partnerVehiclesService.assignDriver(current.id, createdDriver);
    }

    return current;
  },
};
