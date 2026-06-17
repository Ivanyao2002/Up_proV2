import { LINKS } from "@/core/api/links";
import type { ListParams } from "@/shared/types/listParams";
import { downloadComptaExport } from "./comptaDownload";

export const comptaExportService = {
  ledger: (params?: ListParams) =>
    downloadComptaExport(
      LINKS.admin.v1.finance.ledgerExport,
      "journal-comptable.csv",
      params
    ),

  reports: (params?: ListParams) =>
    downloadComptaExport(LINKS.admin.v1.reportsExport, "rapport-comptable.csv", params),
};
