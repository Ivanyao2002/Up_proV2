import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS } from "@/core/api/links";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehicleDetail } from "@/shared/types";
import type { CreateDriverV1Context } from "./partnerDrivers.v1.service";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";
import { uploadVehiclePiecesForPartner } from "./kycDocumentUpload.v1.service";

export interface VehicleCreateFlowOptions {
  pieces?: VehiclePieceFile[];
  driver?: CreateDriverPayload | null;
  driverDocuments?: DriverDocumentFile[];
  partnerId?: string;
  rideCategoryCode?: string;
  driverPhoneVerified?: boolean;
}

type CreatedDriver = {
  id: string | number;
  user_id?: string;
  first_name: string;
  last_name: string;
};

export async function applyVehicleCreateFlow(
  vehicle: VehicleDetail,
  options: VehicleCreateFlowOptions,
  handlers: {
    legacyDocumentsPath?: (vehicleId: string | number) => string;
    createDriverWithDocuments?: (
      driver: CreateDriverPayload,
      documents: DriverDocumentFile[],
      context: CreateDriverV1Context
    ) => Promise<CreatedDriver>;
    assignDriver?: (
      vehicleId: string | number,
      driver: CreatedDriver
    ) => Promise<VehicleDetail>;
  }
): Promise<VehicleDetail> {
  const { pieces = [], driver, driverDocuments = [] } = options;
  let current = vehicle;

  const partnerId = options.partnerId?.trim();

  for (const piece of pieces) {
    if (handlers.legacyDocumentsPath) {
      current = await apiClient.post<VehicleDetail>(
        handlers.legacyDocumentsPath(current.id),
        { type: piece.type as VehicleDocumentType, filename: piece.file.name }
      );
      continue;
    }

    if (partnerId) {
      await uploadVehiclePiecesForPartner(partnerId, String(current.id), [
        piece,
      ]);
    }
  }

  if (driver && handlers.createDriverWithDocuments && handlers.assignDriver) {
    const driverContext: CreateDriverV1Context = {
      partnerId: options.partnerId,
      rideCategoryCode: options.rideCategoryCode,
      phoneVerified: options.driverPhoneVerified,
    };
    const createdDriver = await handlers.createDriverWithDocuments(
      driver,
      driverDocuments,
      driverContext
    );
    current = await handlers.assignDriver(current.id, createdDriver);
    return {
      ...current,
      driver_name: `${createdDriver.first_name} ${createdDriver.last_name}`.trim(),
    };
  }

  return current;
}

export function legacyPartnerDocumentsPath(vehicleId: string | number): string {
  return `/partner/vehicles/${vehicleId}/documents`;
}

export function legacyAdminDocumentsPath(vehicleId: string | number): string {
  return `/admin/fleet/vehicles/${vehicleId}/documents`;
}

export interface AssignDriverV1Options {
  baseVehicle?: VehicleDetail;
  /** Scope partenaire (admin / portail partenaire) — requis pour retrouver le véhicule côté API. */
  partnerId?: string;
}

function buildAssignDriverBodies(driver: CreatedDriver): Record<string, string>[] {
  const driverId = String(driver.id);
  return [{ driverId }, { driver_id: driverId }];
}

export async function assignDriverV1(
  vehicleId: string | number,
  driver: CreatedDriver,
  options: AssignDriverV1Options = {}
): Promise<VehicleDetail> {
  const partnerId = options.partnerId?.trim();
  const endpoint = partnerId
    ? LINKS.v1.partners.assignDriver(partnerId, String(vehicleId))
    : LINKS.v1.vehicles.assignDriver(String(vehicleId));

  const bodies = buildAssignDriverBodies(driver);
  let lastError: unknown;

  for (const body of bodies) {
    try {
      const response = await apiClient.post<{
        vehicle?: VehicleDetail;
        assignment?: { vehicle?: VehicleDetail };
      }>(endpoint, body);

      const assigned =
        response.vehicle ??
        response.assignment?.vehicle ??
        options.baseVehicle ??
        ({} as VehicleDetail);

      return {
        ...assigned,
        id: assigned.id ?? vehicleId,
        driver_name: `${driver.first_name} ${driver.last_name}`.trim(),
      };
    } catch (error) {
      lastError = error;
      const code =
        error instanceof ApiError ? error.code : undefined;
      if (code !== "DRIVER_NOT_FOUND") throw error;
    }
  }

  throw lastError ?? new Error("Assignation chauffeur impossible.");
}
