import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { LiveMapData, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchiseReconciliationRow {
  id: string;
  date_label: string;
  source: string;
  partner_id?: number | string;
  partner_name?: string;
  expected_fcfa: number;
  received_fcfa: number;
  delta_fcfa: number;
  status: "matched" | "discrepancy" | "pending";
}

export interface FranchiseReconciliationWallet {
  balance_xof: number;
  available_xof: number;
  pending_withdrawal_xof: number;
  currency: string;
  status: string;
  updated_at: string;
}

export interface FranchiseReconciliationListResponse
  extends Paginated<FranchiseReconciliationRow> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
  wallet?: FranchiseReconciliationWallet;
}

function mapReconciliationRow(item: Record<string, any>): FranchiseReconciliationRow {
  const expected = item.expected_amount_xof ?? item.expected_fcfa ?? item.expected_xof ?? 0;
  const received = item.received_amount_xof ?? item.received_fcfa ?? item.received_xof ?? 0;
  return {
    id: item.id ?? item.entry_id ?? String(Math.random()),
    date_label:
      item.date_label ??
      item.period_label ??
      item.period ??
      item.created_at?.slice(0, 10) ??
      "—",
    source: item.source ?? item.type ?? item.entry_type ?? "—",
    partner_id: item.partner_id ?? item.partnerId ?? undefined,
    partner_name: item.partner_name ?? item.partnerName ?? undefined,
    expected_fcfa: expected,
    received_fcfa: received,
    delta_fcfa: item.delta_xof ?? item.delta_fcfa ?? received - expected,
    status:
      item.status === "matched"
        ? "matched"
        : item.status === "discrepancy"
        ? "discrepancy"
        : "pending",
  };
}

function mapV1ReconciliationResponse(
  raw: Record<string, any>,
  params?: ListParams
): FranchiseReconciliationListResponse {
  const items: any[] = raw.items ?? raw.entries ?? raw.data ?? [];
  const pg = raw.pagination ?? {};
  const perPage = pg.limit ?? pg.per_page ?? params?.per_page ?? 25;
  const total = pg.total ?? items.length;
  const wallet = raw.wallet
    ? {
        balance_xof: raw.wallet.balance_cached_xof ?? 0,
        available_xof: raw.wallet.available_xof ?? 0,
        pending_withdrawal_xof: raw.wallet.pending_withdrawal_xof ?? 0,
        currency: raw.wallet.currency ?? "XOF",
        status: raw.wallet.status ?? "active",
        updated_at: raw.wallet.updated_at ?? new Date().toISOString(),
      }
    : undefined;

  return {
    data: items.map(mapReconciliationRow),
    meta: {
      total,
      current_page: pg.page ?? params?.page ?? 1,
      per_page: perPage,
      last_page: pg.total_pages ?? Math.max(1, Math.ceil(total / perPage)),
    },
    filter_options: raw.filter_options ?? { partners: [] },
    wallet,
  };
}

export const franchiseReconciliationService = {
  list: async (params?: ListParams): Promise<FranchiseReconciliationListResponse> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchiseReconciliationListResponse>(
        `/franchise/finance/reconciliation${buildListQuery(params)}`
      );
    }
    const raw = await apiClient.get<Record<string, any>>(
      appendQuery(LINKS.franchise.v1.reconciliation, buildV1ListQuery(params))
    );
    return mapV1ReconciliationResponse(raw, params);
  },
};
