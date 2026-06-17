"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { cashReconciliationsService } from "./cashReconciliations.service";
import { comptaKeys } from "./compta.keys";

export function useCashReconciliationsList(params?: ListParams) {
  return useQuery({
    queryKey: comptaKeys.cashReconciliations.list(params),
    queryFn: () => cashReconciliationsService.listAdmin(params),
  });
}
