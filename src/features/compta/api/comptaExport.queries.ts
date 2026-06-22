"use client";

import { useMutation } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { useComptaApiScope } from "./useComptaApiScope";
import { comptaExportService } from "./comptaExport.service";

export function useComptaLedgerExport() {
  const scope = useComptaApiScope();
  return useMutation({
    mutationFn: (params?: ListParams) => comptaExportService.ledger(scope, params),
  });
}

export function useComptaReportsExport() {
  const scope = useComptaApiScope();
  return useMutation({
    mutationFn: (params?: ListParams) => comptaExportService.reports(scope, params),
  });
}
