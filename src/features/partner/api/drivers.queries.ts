"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerDriversService } from "./drivers.service";
import type { CreateDriverPayload } from "./drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { KycDocument } from "@/shared/types";

export const partnerDriversKeys = {
  all: ["partner", "drivers"] as const,
  list: () => [...partnerDriversKeys.all, "list"] as const,
  detail: (id: string) => [...partnerDriversKeys.all, "detail", id] as const,
};

export function usePartnerDriversList() {
  return useQuery({
    queryKey: partnerDriversKeys.list(),
    queryFn: () => partnerDriversService.list(),
  });
}

export function usePartnerDriverDetail(id: string) {
  return useQuery({
    queryKey: partnerDriversKeys.detail(id),
    queryFn: () => partnerDriversService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePartnerDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      documents = [],
    }: {
      data: CreateDriverPayload;
      documents?: DriverDocumentFile[];
    }) => partnerDriversService.createWithDocuments(data, documents),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
    },
  });
}

export function useUploadPartnerDriverDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: KycDocument["type"]; file: File }) =>
      partnerDriversService.uploadDocument(driverId, type, file.name),
    onSuccess: (data) => {
      qc.setQueryData(partnerDriversKeys.detail(driverId), data);
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.list() });
    },
  });
}
