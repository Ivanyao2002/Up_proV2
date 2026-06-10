/** Paramètres communs pour les listes paginées côté API. */
export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  severity?: string;
  zone?: string;
  zone_id?: number;
  availability?: string;
  account_status?: string;
  type?: string;
  service?: string;
  franchise_id?: number | string;
  partner_id?: number | string;
  /** Plage de dates (YYYY-MM-DD) — envoyée à l’API v1 en `dateFrom` / `dateTo`. */
  date_from?: string;
  date_to?: string;
}

export function buildListQuery(params?: ListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.zone && params.zone !== "all") qs.set("zone", params.zone);
  if (params.zone_id != null) qs.set("zone_id", String(params.zone_id));
  if (params.availability && params.availability !== "all") {
    qs.set("availability", params.availability);
  }
  if (params.account_status && params.account_status !== "all") {
    qs.set("account_status", params.account_status);
  }
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.service && params.service !== "all") qs.set("service", params.service);
  if (params.franchise_id != null) qs.set("franchise_id", String(params.franchise_id));
  if (params.partner_id != null) qs.set("partner_id", String(params.partner_id));
  if (params.date_from?.trim()) qs.set("date_from", params.date_from.trim());
  if (params.date_to?.trim()) qs.set("date_to", params.date_to.trim());
  const s = qs.toString();
  return s ? `?${s}` : "";
}
