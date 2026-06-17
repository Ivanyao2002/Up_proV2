"use client";

import { useQuery } from "@tanstack/react-query";
import { useComptaApiScope } from "@/features/compta/api/useComptaApiScope";
import {
  commissionsService,
  reconciliationService,
} from "./commissions.service";
import type { ListParams } from "@/shared/types/listParams";

export const commissionsKeys = {
  all: ["finance", "commissions"] as const,
  list: (scope: string, filters?: ListParams) =>
    [...commissionsKeys.all, "list", scope, filters] as const,
};

export const reconciliationKeys = {
  all: ["finance", "reconciliation"] as const,
  list: (scope: string, filters?: ListParams) =>
    [...reconciliationKeys.all, "list", scope, filters] as const,
};

export function useCommissionsList(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: commissionsKeys.list(scope, params),
    queryFn: () => commissionsService.list(params, scope),
  });
}

export function useReconciliationList(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: reconciliationKeys.list(scope, params),
    queryFn: () => reconciliationService.list(params, scope),
  });
}
