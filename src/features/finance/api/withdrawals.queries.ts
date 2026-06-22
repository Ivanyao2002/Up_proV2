"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withdrawalsKeys } from "./withdrawals.keys";
import { withdrawalsService } from "./withdrawals.service";
import type { ListParams } from "@/shared/types/listParams";

export function useWithdrawalsList(params?: ListParams) {
  return useQuery({
    queryKey: withdrawalsKeys.list(params),
    queryFn: () => withdrawalsService.listAdmin(params),
  });
}

export function useWithdrawalDetail(id: string) {
  return useQuery({
    queryKey: withdrawalsKeys.detail(id),
    queryFn: () => withdrawalsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useApproveWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawalsService.approve(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: withdrawalsKeys.all });
      void qc.invalidateQueries({ queryKey: withdrawalsKeys.detail(id) });
    },
  });
}

export function useRejectWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawalsService.reject(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: withdrawalsKeys.all });
      void qc.invalidateQueries({ queryKey: withdrawalsKeys.detail(id) });
    },
  });
}
