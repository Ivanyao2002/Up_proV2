"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { useComptaApiScope } from "./useComptaApiScope";
import { comptaKeys } from "./compta.keys";
import { ledgerService } from "./ledger.service";

export function useLedgerList(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: comptaKeys.ledger.list(scope, params),
    queryFn: () => ledgerService.list(scope, params),
  });
}

export function useLedgerExport() {
  const scope = useComptaApiScope();
  return useMutation({
    mutationFn: (params?: ListParams) => ledgerService.exportCsv(scope, params),
  });
}

export function useReverseLedgerEntry() {
  const scope = useComptaApiScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      reason: string;
      justification_ref?: string;
    }) => ledgerService.reverseEntry(scope, payload.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: comptaKeys.ledger.all });
    },
  });
}
