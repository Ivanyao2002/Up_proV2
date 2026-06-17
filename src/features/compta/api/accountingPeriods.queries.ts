"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comptaKeys } from "./compta.keys";
import { accountingPeriodsService } from "./accountingPeriods.service";

export function useAccountingPeriodsList() {
  return useQuery({
    queryKey: comptaKeys.periods.list(),
    queryFn: () => accountingPeriodsService.listAdmin(),
  });
}

export function useCloseAccountingPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: {
      period_type?: "daily" | "monthly";
      period_end?: string;
      force?: boolean;
      note?: string;
    }) => accountingPeriodsService.closeCurrent(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: comptaKeys.periods.all });
    },
  });
}
