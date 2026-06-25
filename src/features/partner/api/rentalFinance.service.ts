import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

/**
 * Finance & reversements du module LOCATION (DB-RENT-17).
 * Les montants (commissions, frais, net) sont calculés côté serveur ;
 * le front ne fait qu'afficher.
 */

export interface RentalFinanceSummary {
  gross_fcfa: number;
  commission_fcfa: number;
  fees_fcfa: number;
  taxes_fcfa: number;
  net_fcfa: number;
}

export type RentalSettlementStatus = "pending" | "paid" | "hold";

export interface RentalSettlement {
  id: string;
  ref?: string;
  period?: string;
  amount_fcfa: number;
  status: RentalSettlementStatus;
  created_at?: string;
  paid_at?: string;
  hold_reason?: string;
}

interface SettlementsApiResponse {
  status?: string;
  items?: RentalSettlement[];
  pagination?: { page: number; limit: number; total: number; hasMore: boolean };
}

const EMPTY_SUMMARY: RentalFinanceSummary = {
  gross_fcfa: 0,
  commission_fcfa: 0,
  fees_fcfa: 0,
  taxes_fcfa: 0,
  net_fcfa: 0,
};

function mapSettlements(
  response: SettlementsApiResponse | Paginated<RentalSettlement>
): Paginated<RentalSettlement> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items,
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            last_page: response.pagination.hasMore
              ? response.pagination.page + 1
              : response.pagination.page,
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return response as Paginated<RentalSettlement>;
  }
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

export const partnerRentalFinanceService = {
  summary: async (partnerId: string | number) => {
    try {
      const raw = await apiClient.get<RentalFinanceSummary>(
        LINKS.partner.rental.finance.summary(partnerId)
      );
      return raw ?? EMPTY_SUMMARY;
    } catch {
      return EMPTY_SUMMARY;
    }
  },

  settlements: async (partnerId: string | number, params?: ListParams) => {
    try {
      const response = await apiClient.get<SettlementsApiResponse>(
        `${LINKS.partner.rental.finance.settlements(partnerId)}${buildListQuery(params)}`
      );
      return mapSettlements(response);
    } catch {
      return {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
      } satisfies Paginated<RentalSettlement>;
    }
  },
};

export const RENTAL_SETTLEMENT_STATUS_CONFIG: Record<
  RentalSettlementStatus,
  { label: string; color: string }
> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé", color: "bg-green-100 text-green-700" },
  hold: { label: "Bloqué (litige)", color: "bg-red-100 text-red-700" },
};
