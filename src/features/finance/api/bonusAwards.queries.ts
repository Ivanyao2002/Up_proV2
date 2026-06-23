"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";
import { bonusAwardsKeys } from "./bonusAwards.keys";
import { bonusAwardsService } from "./bonusAwards.service";

export function useBonusAwardsList(params?: ListParams) {
  return useQuery({
    queryKey: bonusAwardsKeys.list(params),
    queryFn: () => bonusAwardsService.list(params),
  });
}

export function useRunBonusEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => bonusAwardsService.runEvaluation(),
    onSuccess: (result) => {
      notificationService.success(
        result.awarded > 0
          ? `${result.message} — ${result.awarded} attribution${result.awarded > 1 ? "s" : ""}`
          : result.message
      );
      void qc.invalidateQueries({ queryKey: bonusAwardsKeys.all });
    },
    onError: (error) => {
      notificationService.error(
        error instanceof Error && error.message
          ? error.message
          : "Échec de l'évaluation des bonus"
      );
    },
  });
}
