"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import {
  adminVehiclesService,
  type AdminVehicleCreatePayload,
} from "./adminVehicles.service";
import {
  fetchVehicleBrandModels,
  fetchVehicleBrands,
  fetchVehicleCategories,
  fetchVehicleColors,
} from "./vehicleCatalog.service";
import { adminVehiclesKeys } from "./vehicles.keys";
import type { ListParams } from "@/shared/types/listParams";

export function useAdminVehiclesList(params?: ListParams) {
  return useQuery({
    queryKey: adminVehiclesKeys.list(params),
    queryFn: () => adminVehiclesService.listAdmin(params),
  });
}

export function useVehicleCategoriesCatalog() {
  return useQuery({
    queryKey: adminVehiclesKeys.catalog.categories,
    queryFn: fetchVehicleCategories,
    staleTime: 5 * 60_000,
  });
}

export function useVehicleBrandsCatalog() {
  return useQuery({
    queryKey: adminVehiclesKeys.catalog.brands,
    queryFn: fetchVehicleBrands,
    staleTime: 5 * 60_000,
  });
}

export function useVehicleColorsCatalog() {
  return useQuery({
    queryKey: adminVehiclesKeys.catalog.colors,
    queryFn: fetchVehicleColors,
    staleTime: 5 * 60_000,
  });
}

export function useVehicleBrandModelsCatalog(brandCode: string) {
  return useQuery({
    queryKey: adminVehiclesKeys.catalog.models(brandCode),
    queryFn: () => fetchVehicleBrandModels(brandCode),
    enabled: Boolean(brandCode.trim()),
    staleTime: 5 * 60_000,
  });
}

export function useCreateAdminVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      pieces = [],
      driver = null,
      driverDocuments = [],
      driverPhoneVerified = false,
    }: {
      data: AdminVehicleCreatePayload;
      pieces?: VehiclePieceFile[];
      driver?: CreateDriverPayload | null;
      driverDocuments?: DriverDocumentFile[];
      driverPhoneVerified?: boolean;
    }) =>
      adminVehiclesService.createWithOptions(data, {
        pieces,
        driver,
        driverDocuments,
        driverPhoneVerified,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminVehiclesKeys.all });
    },
    onError: () => notificationService.error("Impossible de créer le véhicule"),
  });
}

export function useDeleteAdminVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => adminVehiclesService.delete(vehicleId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminVehiclesKeys.all });
      notificationService.success("Véhicule supprimé");
    },
    onError: () => notificationService.error("Suppression impossible"),
  });
}
