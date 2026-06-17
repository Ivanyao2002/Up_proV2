"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useComptaApiScope } from "@/features/compta/api/useComptaApiScope";
import { withdrawalsKeys } from "./withdrawals.keys";
import { withdrawalsService } from "./withdrawals.service";
import type { ListParams } from "@/shared/types/listParams";

export function useWithdrawalsList(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: [...withdrawalsKeys.list(params), scope],
    queryFn: () => withdrawalsService.list(scope, params),
  });
}

export function useWithdrawalDetail(id: string) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: [...withdrawalsKeys.detail(id), scope],
    queryFn: () => withdrawalsService.getById(scope, id),
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
