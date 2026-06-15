import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated, Partner } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ApiAdminPartnerItem } from "./adminPartners.api.types";

function mapPartnerStatus(status?: string | null): Partner["status"] {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "active") return "active";
  if (key === "suspended") return "suspended";
  return "pending";
}

export type PartnerLookupMaps = {
  cityById?: Map<string, string>;
  franchiseNameById?: Map<string, string>;
};

function resolveCity(
  item: ApiAdminPartnerItem,
  cityById?: Map<string, string>
): string {
  if (item.cityLabel?.trim()) return item.cityLabel.trim();
  if (item.city_id && cityById?.get(item.city_id)) {
    return cityById.get(item.city_id)!;
  }
  return "—";
}

function resolveFranchiseName(
  item: ApiAdminPartnerItem,
  franchiseNameById?: Map<string, string>
): string {
  if (item.franchiseName?.trim()) return item.franchiseName.trim();
  const fid = item.franchise_id ? String(item.franchise_id) : "";
  if (fid && franchiseNameById?.get(fid)) return franchiseNameById.get(fid)!;
  if (fid) return `Franchise ${fid.slice(0, 8)}`;
  return "—";
}

export function mapAdminPartnerItemToPartner(
  item: ApiAdminPartnerItem,
  lookups?: PartnerLookupMaps
): Partner {
  return {
    id: item.id,
    name:
      item.name ??
      item.trade_name ??
      item.legal_name ??
      `Partenaire ${item.id.slice(0, 8)}`,
    franchise_name: resolveFranchiseName(item, lookups?.franchiseNameById),
    franchise_id: item.franchise_id ?? "—",
    city: resolveCity(item, lookups?.cityById),
    drivers_count: item.driversCount ?? 0,
    status: mapPartnerStatus(item.status),
    contact_email: item.contact_email ?? "—",
    contact_phone: item.contact_phone ?? "—",
    partner_type: item.partner_type ?? null,
    commission_rate: item.commission_rate ?? null,
  };
}

function partnerMatchesFilters(partner: Partner, params?: ListParams): boolean {
  if (params?.status && partner.status !== params.status) return false;
  return true;
}

export function mapAdminPartnersToPaginated(
  items: ApiAdminPartnerItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination,
  lookups?: PartnerLookupMaps
): Paginated<Partner> {
  const partners = items
    .map((item) => mapAdminPartnerItemToPartner(item, lookups))
    .filter((p) => partnerMatchesFilters(p, params));

  if (serverPagination) {
    return {
      data: partners,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }

  return paginateClientList(partners, params, (p) =>
    partnerMatchesFilters(p, params)
  );
}
