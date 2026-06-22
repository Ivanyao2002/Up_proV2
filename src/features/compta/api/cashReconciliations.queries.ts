"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { useComptaApiScope } from "./useComptaApiScope";
import { cashReconciliationsService } from "./cashReconciliations.service";
import { comptaKeys } from "./compta.keys";

export function useCashReconciliationsList(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: comptaKeys.cashReconciliations.list(scope, params),
    queryFn: () => cashReconciliationsService.list(scope, params),
  });
}
