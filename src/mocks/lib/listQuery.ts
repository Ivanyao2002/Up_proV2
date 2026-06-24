import { paginate, type PaginateParams } from "./paginate";

export interface ListQuery extends PaginateParams {
  search: string | null;
  date_from: string | null;
  date_to: string | null;
  status: string | null;
  severity: string | null;
  zone: string | null;
  zone_id: number | null;
  availability: string | null;
  account_status: string | null;
  compliance_status: string | null;
  type: string | null;
  service: string | null;
  franchise_id: number | null;
  partner_id: number | null;
  reporter_type: string | null;
}

export function parseListQuery(request: Request): ListQuery {
  const url = new URL(request.url);
  const zoneIdRaw = url.searchParams.get("zone_id");
  return {
    page: Number(url.searchParams.get("page") ?? "1"),
    per_page: Number(
      url.searchParams.get("per_page") ??
        url.searchParams.get("limit") ??
        "25"
    ),
    search: url.searchParams.get("search"),
    date_from:
      url.searchParams.get("date_from") ?? url.searchParams.get("dateFrom"),
    date_to: url.searchParams.get("date_to") ?? url.searchParams.get("dateTo"),
    status:
      url.searchParams.get("status") ??
      url.searchParams.get("approvalStatus") ??
      url.searchParams.get("approval_status"),
    severity: url.searchParams.get("severity"),
    zone: url.searchParams.get("zone"),
    zone_id: zoneIdRaw ? Number(zoneIdRaw) : null,
    availability: url.searchParams.get("availability"),
    account_status: url.searchParams.get("account_status"),
    compliance_status: url.searchParams.get("compliance_status"),
    type: url.searchParams.get("type"),
    service: url.searchParams.get("service"),
    franchise_id: parseIdParam(url.searchParams.get("franchise_id")),
    partner_id: parseIdParam(url.searchParams.get("partner_id")),
    reporter_type: url.searchParams.get("reporter_type"),
  };
}

function parseIdParam(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function matchesSearch(
  search: string | null,
  ...parts: (string | null | undefined)[]
): boolean {
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => (p ?? "").toLowerCase().includes(q));
}

export function matchesDateRange(
  iso: string | null | undefined,
  query: Pick<ListQuery, "date_from" | "date_to">
): boolean {
  const from = query.date_from?.trim();
  const to = query.date_to?.trim();
  if (!from && !to) return true;
  if (!iso?.trim()) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (date > end) return false;
  }
  return true;
}

export function paginatedList<T>(
  items: T[],
  query: ListQuery,
  getDate?: (item: T) => string | null | undefined
) {
  let rows = items;
  if (getDate) {
    rows = rows.filter((item) => matchesDateRange(getDate(item), query));
  }
  return paginate(rows, { page: query.page, per_page: query.per_page });
}
