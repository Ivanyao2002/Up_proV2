import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Driver, DriverComplianceStatus } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { Paginated } from "@/shared/types";
import type { ApiAdminDriverItem } from "./adminDrivers.api.types";

function mapAccountStatus(item: ApiAdminDriverItem): Driver["account_status"] {
  const direct = String(item.account_status ?? "").toLowerCase();
  if (direct === "approved" || direct === "active") return "approved";
  if (direct === "suspended") return "suspended";
  if (direct === "banned") return "banned";
  if (direct === "pending") return "pending";
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
  if (key === "online" || key === "available") return "online";
  return "online";
}

function mapDocumentsSummary(
  summary?: ApiAdminDriverItem["documentsSummary"] | null
): Driver["documents_summary"] {
  if (!summary) return undefined;
  return {
    required_count: summary.requiredCount ?? 0,
    uploaded_count: summary.uploadedCount ?? 0,
    approved_count: summary.approvedCount ?? 0,
    pending_count: summary.pendingCount ?? 0,
    rejected_count: summary.rejectedCount ?? 0,
    missing_count: summary.missingCount ?? 0,
    missing_types: summary.missingTypes ?? [],
    is_complete: summary.isComplete ?? false,
    has_any_document: summary.hasAnyDocument ?? false,
  };
}

function mapComplianceStatus(
  value?: string | null
): DriverComplianceStatus | undefined {
  const key = value?.trim();
  return key ? (key as DriverComplianceStatus) : undefined;
}

function driverDisplayName(item: ApiAdminDriverItem): {
  first_name: string;
  last_name: string;
} {
  // Format /v1/franchises/{id}/partners/{id}/drivers — fullName plat
  const fullName = item.fullName?.trim();
  if (fullName && fullName !== "Chauffeur") {
    const parts = fullName.split(/\s+/);
    if (parts.length <= 1) return { first_name: fullName, last_name: "" };
    return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
  }
  // Champs plats first_name / last_name
  const flatFirst = item.first_name?.trim();
  const flatLast = item.last_name?.trim();
  if (flatFirst || flatLast) {
    return { first_name: flatFirst || "Chauffeur", last_name: flatLast ?? "" };
  }
  // Format /v1/admin/drivers — profile.displayName
  const profileName = item.profile?.displayName?.trim();
  if (profileName) {
    const parts = profileName.split(/\s+/);
    if (parts.length <= 1) return { first_name: profileName, last_name: "" };
    return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
  }
  // Format /v1/partners/{id}/drivers (snake_case via user object)
  const uFirst = item.user?.first_name?.trim();
  const uLast = item.user?.last_name?.trim();
  if (uFirst || uLast) {
    return { first_name: uFirst || "Chauffeur", last_name: uLast ?? "" };
  }
  // Format legacy /v1/admin/drivers (camelCase)
  const first = item.firstName?.trim();
  const last = item.lastName?.trim();
  if (first || last) {
    return { first_name: first || "Chauffeur", last_name: last ?? "" };
  }
  const code = item.driver_code?.trim();
  const label = code || `Chauffeur ${item.id.slice(0, 8)}`;
  return { first_name: label, last_name: "" };
}

function resolveZone(item: ApiAdminDriverItem): string {
  const meta = item.metadata ?? {};
  const zoneLabel =
    (meta.zoneLabel as string | undefined) ??
    (meta.zone as string | undefined) ??
    (meta.zoneCode as string | undefined);
  if (zoneLabel) return zoneLabel;
  return item.zoneName ?? item.city_id ?? "—";
}

function resolveVehicleLabel(item: ApiAdminDriverItem): string | undefined {
  if (item.vehicle?.label) return item.vehicle.label;
  if (item.vehicle?.plate) return item.vehicle.plate;
  return item.vehicleLabel ?? undefined;
}

function resolveSuspended(item: ApiAdminDriverItem): boolean {
  const meta = item.metadata ?? {};
  if (typeof meta.suspended === "boolean") return meta.suspended;
  return false;
}

export function mapAdminDriverItemToListDriver(
  item: ApiAdminDriverItem
): Driver {
  const { first_name, last_name } = driverDisplayName(item);

  return {
    id: item.id,
    first_name,
    last_name,
    phone: item.user?.phone ?? item.profile?.phone ?? item.phone ?? "—",
    rating: item.rating_avg ?? 0,
    zone: resolveZone(item),
    owner_name:
      item.partnerName ??
      (item.partner_id
        ? `Partenaire ${String(item.partner_id).slice(0, 8)}`
        : undefined),
    vehicle_label: resolveVehicleLabel(item),
    ride_category_code: item.ride_category_code ?? undefined,
    account_status: mapAccountStatus(item),
    availability: mapAvailability(item),
    franchise_id: item.franchise_id ? String(item.franchise_id) : undefined,
    owner_id: item.partner_id ? String(item.partner_id) : undefined,
    created_at: item.created_at,
    suspended: resolveSuspended(item),
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
  if (
    params?.compliance_status &&
    params.compliance_status !== "all" &&
    driver.compliance_status !== params.compliance_status
  ) {
    return false;
  }
  return true;
}

export function mapAdminDriversToPaginated(
  items: ApiAdminDriverItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<Driver> {
  const drivers = items.map(mapAdminDriverItemToListDriver);

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
