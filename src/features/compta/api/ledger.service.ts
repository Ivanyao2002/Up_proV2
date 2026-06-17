import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ApiFinanceListResponse, ApiFinanceTransactionItem } from "@/features/finance/api/adminFinance.api.types";
import { transactionsService } from "@/features/finance/api/transactions.service";
import type { ListParams } from "@/shared/types/listParams";
import { downloadComptaExport } from "./comptaDownload";
import { mapLedgerEntry, mapLedgerListResponse } from "./compta.mapper";
import type { LedgerListResponse } from "./compta.types";

export const ledgerService = {
  listAdmin: async (params?: ListParams): Promise<LedgerListResponse> => {
    if (useLegacyAdminApi()) {
      const fallback = await transactionsService.listAdmin(params);
      return {
        data: fallback.data.map((row) =>
          mapLedgerEntry({
            id: row.id,
            entry_type: row.type,
            type: row.type,
            label: row.label,
            amount_fcfa: row.amount_fcfa,
            direction: row.direction,
            status: row.status,
            franchise_name: row.franchise_name,
            created_at: row.created_at,
            posted_at: row.created_at,
          })
        ),
        meta: fallback.meta,
        summary: {
          credits_xof: fallback.summary?.credits_today_fcfa ?? 0,
          debits_xof: fallback.summary?.debits_today_fcfa ?? 0,
        },
        filter_options: fallback.filter_options,
      };
    }

    try {
      const response = await apiClient.get<ApiFinanceListResponse<ApiFinanceTransactionItem>>(
        `${LINKS.admin.v1.finance.ledger}${buildV1ListQuery(params)}`
      );
      return mapLedgerListResponse(response, params);
    } catch {
      const fallback = await transactionsService.listAdmin(params);
      return {
        data: fallback.data.map((row) =>
          mapLedgerEntry({
            id: row.id,
            entry_type: row.type,
            type: row.type,
            label: row.label,
            amount_fcfa: row.amount_fcfa,
            direction: row.direction,
            status: row.status,
            franchise_name: row.franchise_name,
            created_at: row.created_at,
            posted_at: row.created_at,
          })
        ),
        meta: fallback.meta,
        summary: {
          credits_xof: fallback.summary?.credits_today_fcfa ?? 0,
          debits_xof: fallback.summary?.debits_today_fcfa ?? 0,
        },
        filter_options: fallback.filter_options,
      };
    }
  },

  exportAdmin: async (params?: ListParams) => {
    if (useLegacyAdminApi()) {
      throw new Error("Export ledger indisponible en mode legacy");
    }
    return downloadComptaExport(
      LINKS.admin.v1.finance.ledgerExport,
      "journal-comptable.csv",
      params
    );
  },

  reverseEntry: (
    id: string,
    payload: { reason: string; justification_ref?: string; require_second_approval?: boolean }
  ) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        `/admin/finance/ledger/${id}/reverse`,
        payload,
        "Extourne enregistrée"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.finance.ledgerReverse(id),
      payload,
      "Extourne enregistrée"
    );
  },
};
