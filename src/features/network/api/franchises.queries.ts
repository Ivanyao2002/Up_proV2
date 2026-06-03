"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchisesKeys } from "./franchises.keys";
import {
  franchisesService,
  type FranchiseCreatePayload,
} from "./franchises.service";

export function useFranchisesList() {
  return useQuery({
    queryKey: franchisesKeys.list(),
    queryFn: () => franchisesService.listAdmin(),
  });
}

export function useCreateFranchise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseCreatePayload) => franchisesService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisesKeys.all });
      notificationService.success("Franchise créée");
    },
    onError: () => notificationService.error("Création impossible"),
  });
}
