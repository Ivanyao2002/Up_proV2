import type { Driver, DriverDetail, DriverTimelineEvent } from "@/shared/types";
import type { ApiLiveMapDriver } from "@/features/ops/api/liveMap.api.types";
import { isDriverOnTripStatus } from "@/features/ops/api/liveMap.labels";
import type { ApiAdminDriverItem } from "./adminDrivers.api.types";
import type { ApiV1DriverDetailResponse } from "./driverDetail.v1.api.types";
import { splitDisplayName } from "@/features/admin/api/adminOrder.shared";
import { mapApiKycItemToKycDocument } from "./kycDocument.mapper";

function mapAccountStatus(
  approval?: string | null,
  kyc?: string | null
): Driver["account_status"] {
  const approvalKey = String(approval ?? "").toLowerCase();
  if (approvalKey === "suspended" || approvalKey === "banned") {
    return approvalKey === "banned" ? "banned" : "suspended";
  }
  if (approvalKey === "approved") return "approved";
  const kycKey = String(kyc ?? "").toLowerCase();
  if (kycKey === "rejected") return "pending";
  return "pending";
}

function mapAvailability(
  status?: string | null,
  onTrip?: boolean
): Driver["availability"] {
  if (onTrip || isDriverOnTripStatus(status ?? undefined)) return "on_trip";
  const key = String(status ?? "").toLowerCase();
  if (key === "paused" || key === "break") return "paused";
  if (key === "offline") return "offline";
  return "online";
}

function buildTimelineFromListItem(item: ApiAdminDriverItem): DriverTimelineEvent[] {
  const events: DriverTimelineEvent[] = [];
  if (item.created_at) {
    events.push({
      id: "registered",
      type: "registered",
      label: "Inscription",
      at: item.created_at,
    });
  }
  const kyc = String(item.kyc_status ?? "").toLowerCase();
  if (kyc === "approved" && item.updated_at) {
    events.push({
      id: "kyc-approved",
      type: "kyc",
      label: "KYC validé",
      at: item.updated_at,
    });
  }
  if (String(item.approval_status ?? "").toLowerCase() === "approved" && item.updated_at) {
    events.push({
      id: "approved",
      type: "approved",
      label: "Compte approuvé",
      at: item.updated_at,
    });
  }
  return events.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

function buildTimelineFromLiveMap(driver: ApiLiveMapDriver): DriverTimelineEvent[] {
  const events: DriverTimelineEvent[] = [];
  if (driver.profile?.displayName) {
    events.push({
      id: "profile",
      type: "registered",
      label: "Profil actif",
      description: driver.profile.displayName,
      at: new Date().toISOString(),
    });
  }
  if (String(driver.approvalStatus ?? "").toLowerCase() === "approved") {
    events.push({
      id: "approved",
      type: "approved",
      label: "Compte approuvé",
      at: new Date().toISOString(),
    });
  }
  return events;
}

export function mapLiveMapDriverToDetail(
  driver: ApiLiveMapDriver,
  activeTrip?: { id: string; ref: string }
): DriverDetail {
  const { first_name, last_name } = splitDisplayName(
    driver.profile?.displayName ?? driver.driverCode
  );
  const rating = driver.ratingAvg ?? 0;

  return {
    id: driver.id,
    first_name,
    last_name,
    phone: driver.profile?.phone ?? "—",
    email: driver.profile?.email,
    rating: typeof rating === "number" ? rating : 0,
    zone: driver.zoneName ?? driver.cityId ?? "—",
    owner_name: driver.partnerName,
    vehicle_label: driver.vehicleLabel ?? driver.rideCategoryCode ?? "",
    account_status: mapAccountStatus(driver.approvalStatus),
    availability: mapAvailability(driver.availabilityStatus, Boolean(activeTrip)),
    franchise_id: driver.franchiseId as unknown as number | undefined,
    owner_id: driver.partnerId as unknown as number | undefined,
    registered_at: new Date().toISOString(),
    approved_at:
      String(driver.approvalStatus ?? "").toLowerCase() === "approved"
        ? new Date().toISOString()
        : null,
    stats: {
      trips_total: 0,
      trips_completed: 0,
      trips_cancelled: 0,
      acceptance_rate_pct: 0,
      wallet_balance_fcfa: 0,
    },
    timeline: buildTimelineFromLiveMap(driver),
    kyc_documents: [],
  };
}

function readPlate(vehicle?: {
  plateNumber?: string | null;
  plate?: string | null;
  licensePlate?: string | null;
  license_plate?: string | null;
  model?: string | null;
} | null): string {
  if (!vehicle) return "";
  const plate =
    vehicle.plateNumber ??
    vehicle.plate ??
    vehicle.licensePlate ??
    vehicle.license_plate ??
    "";
  const model = vehicle.model?.trim() ?? "";
  return [plate, model].filter(Boolean).join(" · ");
}

function buildTimelineFromV1(
  driver: ApiV1DriverDetailResponse["driver"]
): DriverTimelineEvent[] {
  const events: DriverTimelineEvent[] = [];
  if (driver.created_at) {
    events.push({
      id: "registered",
      type: "registered",
      label: "Inscription",
      description: driver.driver_code ?? undefined,
      at: driver.created_at,
    });
  }
  const kyc = String(driver.kyc_status ?? "").toLowerCase();
  if (kyc === "approved" && driver.updated_at) {
    events.push({
      id: "kyc-approved",
      type: "kyc",
      label: "KYC validé",
      at: driver.updated_at,
    });
  }
  if (String(driver.approval_status ?? "").toLowerCase() === "approved") {
    events.push({
      id: "approved",
      type: "approved",
      label: "Compte approuvé",
      at: driver.updated_at ?? driver.created_at ?? new Date().toISOString(),
    });
  }
  if (driver.last_online_at) {
    events.push({
      id: "last-online",
      type: "registered",
      label: "Dernière connexion",
      at: driver.last_online_at,
    });
  }
  return events.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

function formatDriverZoneLabel(
  zoneName?: string | null,
  city?: { name?: string | null; label?: string | null } | null
): string {
  const zone = zoneName?.trim();
  const cityLabel = city?.label?.trim() || city?.name?.trim();
  if (zone && cityLabel && zone.toLowerCase() !== cityLabel.toLowerCase()) {
    return `${cityLabel} · ${zone}`;
  }
  return zone ?? cityLabel ?? "—";
}

/** GET /v1/drivers/:id → modèle fiche back-office */
export function mapApiV1DriverDetailToDriverDetail(
  response: ApiV1DriverDetailResponse
): DriverDetail {
  const driver = response.driver;
  const profile = response.profile;
  const summary = response.summary;
  const performance = response.performance;
  const vehicle =
    response.vehicle ?? response.vehicles?.[0] ?? null;
  const partner = response.partner;
  const city = response.city;

  const displayName =
    profile?.displayName ??
    profile?.display_name ??
    summary?.displayName ??
    summary?.name ??
    driver.driver_code ??
    "Chauffeur";

  const firstName =
    profile?.firstName ??
    profile?.first_name ??
    splitDisplayName(displayName).first_name;
  const lastName =
    profile?.lastName ??
    profile?.last_name ??
    splitDisplayName(displayName).last_name;

  const rating =
    performance?.ratingAvg ??
    summary?.ratingAvg ??
    summary?.rating ??
    driver.rating_avg ??
    0;

  const tripsCompleted =
    performance?.totalCompletedOrders ??
    driver.total_completed_orders ??
    0;

  const reliability = performance?.reliabilityScore ?? driver.reliability_score;
  const plateLabel = readPlate(vehicle);
  const category = driver.ride_category_code?.trim() ?? "";
  const vehicleLabel =
    response.vehicleLabel?.trim() ||
    [plateLabel, category].filter(Boolean).join(" · ") ||
    category ||
    "—";

  const embeddedKyc = response.kyc_documents ?? response.kycDocuments ?? [];
  const kyc_documents = embeddedKyc.map(mapApiKycItemToKycDocument);

  const approvedAt =
    String(driver.approval_status ?? "").toLowerCase() === "approved"
      ? driver.updated_at ?? driver.created_at ?? null
      : null;

  return {
    id: driver.id,
    driver_code: driver.driver_code ?? summary?.driverCode ?? undefined,
    first_name: firstName,
    last_name: lastName,
    phone:
      (profile?.phone ?? summary?.phone ?? "—").replace(/\s+/g, " ").trim() ||
      "—",
    email: profile?.email ?? undefined,
    rating: typeof rating === "number" ? rating : 0,
    zone: formatDriverZoneLabel(response.zoneName, city),
    owner_name:
      partner?.tradeName ??
      partner?.trade_name ??
      response.partnerName ??
      undefined,
    vehicle_label: vehicleLabel,
    account_status: mapAccountStatus(
      driver.approval_status,
      driver.kyc_status
    ),
    availability: mapAvailability(driver.availability_status),
    franchise_id: driver.franchise_id as unknown as number | undefined,
    owner_id: driver.partner_id as unknown as number | undefined,
    registered_at: driver.created_at ?? new Date().toISOString(),
    approved_at: approvedAt,
    stats: {
      trips_total: tripsCompleted,
      trips_completed: tripsCompleted,
      trips_cancelled: 0,
      acceptance_rate_pct: Math.round((reliability ?? 0) * 100),
      wallet_balance_fcfa: 0,
    },
    timeline: buildTimelineFromV1(driver),
    kyc_documents,
  };
}

export function mapAdminDriverItemToDetail(item: ApiAdminDriverItem): DriverDetail {
  const code = item.driver_code ?? item.id.slice(0, 8);
  const { first_name, last_name } = splitDisplayName(code);

  return {
    id: item.id,
    first_name,
    last_name,
    phone: "—",
    rating: item.rating_avg ?? 0,
    zone: item.city_id ?? "—",
    vehicle_label: item.ride_category_code ?? "",
    account_status: mapAccountStatus(item.approval_status, item.kyc_status),
    availability: mapAvailability(item.availability_status),
    registered_at: item.created_at ?? new Date().toISOString(),
    approved_at:
      String(item.approval_status ?? "").toLowerCase() === "approved"
        ? item.updated_at ?? item.created_at ?? null
        : null,
    stats: {
      trips_total: item.total_completed_orders ?? 0,
      trips_completed: item.total_completed_orders ?? 0,
      trips_cancelled: 0,
      acceptance_rate_pct: Math.round((item.reliability_score ?? 0) * 100),
      wallet_balance_fcfa: 0,
    },
    timeline: buildTimelineFromListItem(item),
    kyc_documents: [],
  };
}
