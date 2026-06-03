"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { DispatchRules } from "@/shared/types";
import { dispatchRulesKeys } from "./dispatchRules.keys";
import { dispatchRulesService } from "./dispatchRules.service";

export function useDispatchRules() {
  return useQuery({
    queryKey: dispatchRulesKeys.detail(),
    queryFn: () => dispatchRulesService.get(),
  });
}

export function useUpdateDispatchRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DispatchRules>) =>
      dispatchRulesService.update(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchRulesKeys.all });
      notificationService.success("Règles enregistrées");
    },
    onError: () => notificationService.error("Enregistrement impossible"),
  });
}
