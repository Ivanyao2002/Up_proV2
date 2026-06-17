"use client";

import { useMutation } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { comptaExportService } from "./comptaExport.service";

export function useComptaLedgerExport() {
  return useMutation({
    mutationFn: (params?: ListParams) => comptaExportService.ledger(params),
  });
}

export function useComptaReportsExport() {
  return useMutation({
    mutationFn: (params?: ListParams) => comptaExportService.reports(params),
  });
}
