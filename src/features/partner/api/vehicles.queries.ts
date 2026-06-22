  "use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  partnerVehiclesService,
  type CreateVehiclePayload,
} from "./vehicles.service";
import type { CreateDriverPayload } from "./drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehiclePieceFile } from "../components/VehicleCreatePiecesSection";
import { partnerDriversKeys } from "./drivers.queries";
import type { ListParams } from "@/shared/types/listParams";
import type { VehicleApprovalStatus } from "@/shared/types";

export const partnerVehiclesKeys = {
  all: ["partner", "vehicles"] as const,
  list: (
    status?: VehicleApprovalStatus | "all",
    filters?: ListParams
  ) => [...partnerVehiclesKeys.all, "list", status ?? "all", filters] as const,
  detail: (id: string) => [...partnerVehiclesKeys.all, "detail", id] as const,
};

export function usePartnerVehiclesList(
  statusFilter: VehicleApprovalStatus | "all" = "all",
  params?: ListParams
) {
  const listParams: ListParams = {
    ...params,
    status:
      statusFilter !== "all"
        ? statusFilter
        : params?.status && params.status !== "all"
          ? params.status
          : undefined,
  };

  return useQuery({
    queryKey: partnerVehiclesKeys.list(statusFilter, listParams),
    queryFn: () => partnerVehiclesService.list(listParams),
  });
}

export function usePartnerVehicleDetail(id: string) {
  return useQuery({
    queryKey: partnerVehiclesKeys.detail(id),
    queryFn: () => partnerVehiclesService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      pieces = [],
      driver = null,
      driverDocuments = [],
      driverPhoneVerified = false,
    }: {
      data: CreateVehiclePayload;
      pieces?: VehiclePieceFile[];
      driver?: CreateDriverPayload | null;
      driverDocuments?: DriverDocumentFile[];
      driverPhoneVerified?: boolean;
    }) =>
      partnerVehiclesService.createWithOptions(data, {
        pieces,
        driver,
        driverDocuments,
        driverPhoneVerified,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerVehiclesKeys.all });
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
    },
  });
}

export function useUploadVehicleRegistration(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => partnerVehiclesService.uploadRegistration(vehicleId, file),
    onSuccess: (data) => {
      qc.setQueryData(partnerVehiclesKeys.detail(vehicleId), data);
      void qc.invalidateQueries({ queryKey: partnerVehiclesKeys.all });
    },
  });
}
