"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import type { ApiBonusRuleUpsertBody } from "./bonusRules.api.types";
import { bonusRulesKeys } from "./bonusRules.keys";
import { bonusRulesService } from "./bonusRules.service";

export function useBonusRulesList(params?: ListParams) {
  return useQuery({
    queryKey: bonusRulesKeys.list(params),
    queryFn: () => bonusRulesService.list(params),
  });
}

export function useBonusRulesListAll() {
  return useQuery({
    queryKey: bonusRulesKeys.list({ all: true }),
    queryFn: () => bonusRulesService.listAll(),
  });
}

export function useSaveBonusRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string | null;
      body: ApiBonusRuleUpsertBody;
    }) => bonusRulesService.saveWithNotify(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bonusRulesKeys.all });
    },
  });
}
