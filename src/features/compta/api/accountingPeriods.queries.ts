"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useComptaApiScope } from "./useComptaApiScope";
import { comptaKeys } from "./compta.keys";
import { accountingPeriodsService } from "./accountingPeriods.service";

export function useAccountingPeriodsList() {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: comptaKeys.periods.list(scope),
    queryFn: () => accountingPeriodsService.list(scope),
  });
}

export function useCloseAccountingPeriod() {
  const scope = useComptaApiScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: {
      period_type?: "daily" | "monthly";
      period_end?: string;
      force?: boolean;
      note?: string;
    }) => accountingPeriodsService.close(scope, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: comptaKeys.periods.all });
    },
  });
}
