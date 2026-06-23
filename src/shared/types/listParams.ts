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
  compliance_status?: string;
  type?: string;
  service?: string;
  franchise_id?: number | string;
  partner_id?: number | string;
  reporter_type?: string;
  /** Catégorie de réclamation support (payment, behavior, service…). */
  category?: string;
  /** Plage de dates (YYYY-MM-DD) — envoyée à l’API v1 en `dateFrom` / `dateTo`. */
  date_from?: string;
  date_to?: string;
  /** Journal comptable — filtre sens écriture. */
  direction?: string;
  balance_bucket?: string;
  entry_type?: string;
}

export function buildListQuery(params?: ListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.severity && params.severity !== "all") qs.set("severity", params.severity);
  if (params.zone && params.zone !== "all") qs.set("zone", params.zone);
  if (params.zone_id != null) qs.set("zone_id", String(params.zone_id));
  if (params.availability && params.availability !== "all") {
    qs.set("availability", params.availability);
  }
  if (params.account_status && params.account_status !== "all") {
    qs.set("account_status", params.account_status);
  }
  if (params.compliance_status && params.compliance_status !== "all") {
    qs.set("compliance_status", params.compliance_status);
  }
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.service && params.service !== "all") qs.set("service", params.service);
  if (params.franchise_id != null) qs.set("franchise_id", String(params.franchise_id));
  if (params.partner_id != null) qs.set("partner_id", String(params.partner_id));
  if (params.reporter_type && params.reporter_type !== "all") qs.set("reporter_type", params.reporter_type);
  if (params.category && params.category !== "all") qs.set("category", params.category);
  if (params.date_from?.trim()) qs.set("date_from", params.date_from.trim());
  if (params.date_to?.trim()) qs.set("date_to", params.date_to.trim());
  if (params.direction && params.direction !== "all") qs.set("direction", params.direction);
  if (params.balance_bucket && params.balance_bucket !== "all") {
    qs.set("balance_bucket", params.balance_bucket);
  }
  if (params.entry_type && params.entry_type !== "all") qs.set("entry_type", params.entry_type);
  const s = qs.toString();
  return s ? `?${s}` : "";
}
