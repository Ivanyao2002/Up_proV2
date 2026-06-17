import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ApiFinanceListResponse, ApiFinanceTransactionItem } from "@/features/finance/api/adminFinance.api.types";
import { fetchScopeFilterOptions } from "@/features/admin/api/adminFilterOptions.service";
import { transactionsService } from "@/features/finance/api/transactions.service";
import type { ListParams } from "@/shared/types/listParams";
import type { ComptaApiScope } from "./comptaApiScope";
import { comptaLedgerLinks } from "./comptaApiScope";
import { downloadComptaExport } from "./comptaDownload";
import { mapLedgerEntry, mapLedgerListResponse } from "./compta.mapper";
import type { LedgerListResponse } from "./compta.types";

export const ledgerService = {
  list: async (
    scope: ComptaApiScope,
    params?: ListParams
  ): Promise<LedgerListResponse> => {
    const links = comptaLedgerLinks(scope);

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
        `${links.ledger}${buildV1ListQuery(params)}`
      );
      const result = mapLedgerListResponse(response, params);
      if (
        scope === "portal" &&
        (result.filter_options?.franchises?.length ?? 0) === 0
      ) {
        try {
          result.filter_options = await fetchScopeFilterOptions("portal");
        } catch {
          // ignore
        }
      }
      return result;
    } catch {
      if (scope === "portal") throw new Error("Impossible de charger le journal comptable");
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

  /** @deprecated Préférer `list("admin", params)` */
  listAdmin: async (params?: ListParams) => ledgerService.list("admin", params),

  exportCsv: async (scope: ComptaApiScope, params?: ListParams) => {
    if (useLegacyAdminApi()) {
      throw new Error("Export ledger indisponible en mode legacy");
    }
    const links = comptaLedgerLinks(scope);
    return downloadComptaExport(links.ledgerExport, "journal-comptable.csv", params);
  },

  /** @deprecated Préférer `exportCsv("admin", params)` */
  exportAdmin: async (params?: ListParams) => ledgerService.exportCsv("admin", params),

  reverseEntry: (
    scope: ComptaApiScope,
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
    const links = comptaLedgerLinks(scope);
    const body =
      scope === "portal"
        ? { reason: payload.reason }
        : payload;
    return apiWithNotify.post(links.ledgerReverse(id), body, "Extourne enregistrée");
  },
};
