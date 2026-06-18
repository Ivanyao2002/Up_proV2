import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";

/** Métadonnées pagination renvoyées par l’API v1 (`page` + `limit`). */
export interface ApiV1Pagination {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const DEFAULT_LIMIT = 25;

/** Query string v1 : `page` + `limit` (pas `per_page`). */
export function buildV1ListQuery(params?: ListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.per_page ?? DEFAULT_LIMIT;
  qs.set("page", String(page));
  qs.set("limit", String(limit));

  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.zone && params.zone !== "all") qs.set("zone", params.zone);
  if (params.availability && params.availability !== "all") {
    qs.set("availability", params.availability);
  }
  if (params.account_status && params.account_status !== "all") {
    qs.set("account_status", params.account_status);
  }
  if (params.compliance_status && params.compliance_status !== "all") {
    qs.set("complianceStatus", params.compliance_status);
  }
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.service && params.service !== "all") qs.set("service", params.service);
  if (params.franchise_id != null) qs.set("franchise_id", String(params.franchise_id));
  if (params.partner_id != null) qs.set("partner_id", String(params.partner_id));
  if (params.date_from?.trim()) qs.set("dateFrom", params.date_from.trim());
  if (params.date_to?.trim()) qs.set("dateTo", params.date_to.trim());

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function mapV1PaginationToMeta(
  pagination?: ApiV1Pagination | null,
  fallback?: Pick<ListParams, "page" | "per_page">
): Paginated<unknown>["meta"] {
  const page = pagination?.page ?? fallback?.page ?? 1;
  const perPage = pagination?.limit ?? fallback?.per_page ?? DEFAULT_LIMIT;
  const total = pagination?.total ?? 0;
  const lastPage =
    pagination?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, perPage)));

  return {
    total,
    per_page: perPage,
    current_page: page,
    last_page: lastPage,
  };
}
