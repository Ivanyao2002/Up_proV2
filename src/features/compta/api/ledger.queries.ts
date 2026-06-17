"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { comptaKeys } from "./compta.keys";
import { ledgerService } from "./ledger.service";

export function useLedgerList(params?: ListParams) {
  return useQuery({
    queryKey: comptaKeys.ledger.list(params),
    queryFn: () => ledgerService.listAdmin(params),
  });
}

export function useLedgerExport() {
  return useMutation({
    mutationFn: (params?: ListParams) => ledgerService.exportAdmin(params),
  });
}

export function useReverseLedgerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      reason: string;
      justification_ref?: string;
    }) => ledgerService.reverseEntry(payload.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: comptaKeys.ledger.all });
    },
  });
}
