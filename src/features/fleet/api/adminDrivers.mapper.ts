import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Driver } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { Paginated } from "@/shared/types";
import type { ApiAdminDriverItem } from "./adminDrivers.api.types";

function mapAccountStatus(item: ApiAdminDriverItem): Driver["account_status"] {
  const approval = String(item.approval_status ?? "").toLowerCase();
  if (approval === "approved") return "approved";
  if (approval === "suspended") return "suspended";
  if (approval === "banned") return "banned";
  return "pending";
}

function mapAvailability(item: ApiAdminDriverItem): Driver["availability"] {
  const key = String(item.availability_status ?? "").toLowerCase();
  if (key === "on_trip" || key === "on-trip" || key === "busy") {
    return "on_trip";
  }
  if (key === "paused" || key === "break") return "paused";
  if (key === "offline") return "offline";
  return "online";
}

function driverDisplayName(item: ApiAdminDriverItem): {
  first_name: string;
  last_name: string;
} {
  const profileName = item.profile?.displayName?.trim();
  if (profileName) {
    const parts = profileName.split(/\s+/);
    if (parts.length <= 1) return { first_name: profileName, last_name: "" };
    return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
  }
  const first = item.firstName?.trim();
  const last = item.lastName?.trim();
  if (first || last) {
    return { first_name: first || "Chauffeur", last_name: last ?? "" };
  }
  const code = item.driver_code?.trim();
  const label = code || `Chauffeur ${item.id.slice(0, 8)}`;
  return { first_name: label, last_name: "" };
}

export function mapAdminDriverItemToListDriver(
  item: ApiAdminDriverItem
): Driver {
  const { first_name, last_name } = driverDisplayName(item);

  return {
    id: item.id,
    first_name,
    last_name,
    phone: item.profile?.phone ?? item.phone ?? "—",
    rating: item.rating_avg ?? 0,
    zone: item.zoneName ?? item.city_id ?? "—",
    owner_name:
      item.partnerName ??
      (item.partner_id
        ? `Partenaire ${String(item.partner_id).slice(0, 8)}`
        : undefined),
    vehicle_label: item.vehicleLabel ?? item.ride_category_code ?? undefined,
    account_status: mapAccountStatus(item),
    availability: mapAvailability(item),
    franchise_id: item.franchise_id
      ? String(item.franchise_id)
      : undefined,
    owner_id: item.partner_id ? String(item.partner_id) : undefined,
  };
}

function driverMatchesFilters(driver: Driver, params?: ListParams): boolean {
  if (params?.zone && driver.zone !== params.zone) return false;
  if (
    params?.account_status &&
    driver.account_status !== params.account_status
  ) {
    return false;
  }
  if (params?.availability && driver.availability !== params.availability) {
    return false;
  }
  return true;
}

export function mapAdminDriversToPaginated(
  items: ApiAdminDriverItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<Driver> {
  const drivers = items
    .map(mapAdminDriverItemToListDriver)
    .filter((d) => driverMatchesFilters(d, params));

  if (serverPagination) {
    return {
      data: drivers,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }

  return paginateClientList(drivers, params, (d) =>
    driverMatchesFilters(d, params)
  );
}
