import type { ListParams } from "@/shared/types/listParams";
import type { ComptaApiScope } from "./comptaApiScope";
import { comptaFinanceLinks, comptaLedgerLinks } from "./comptaApiScope";
import { downloadComptaExport } from "./comptaDownload";

export const comptaExportService = {
  ledger: (scope: ComptaApiScope, params?: ListParams) =>
    downloadComptaExport(
      comptaLedgerLinks(scope).ledgerExport,
      "journal-comptable.csv",
      params
    ),

  reports: (scope: ComptaApiScope, params?: ListParams) =>
    downloadComptaExport(
      comptaFinanceLinks(scope).reportsExport,
      "rapport-comptable.csv",
      params
    ),
};
