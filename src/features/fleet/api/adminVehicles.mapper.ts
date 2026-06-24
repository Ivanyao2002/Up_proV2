import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated, Vehicle, VehicleApprovalStatus, VehicleCategory, VehicleDetail } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ApiV1VehicleItem } from "./adminVehicles.api.types";
import type { VehicleCatalogLookups } from "./vehicleCatalog.service";

// Catalogue API (8 catégories) → catégorie UI. Sans cette couverture complète,
// MOTO/TRICYCLE/FOURGON/CAMION retombaient sur « taxi » → badge service erroné.
const CATEGORY_CODE_TO_UI: Record<string, VehicleCategory> = {
  ECO: "taxi",
  CONFORT: "taxi",
  CONFORT_PLUS: "taxi",
  PREMIUM: "premium",
  MOTO: "delivery",
  TRICYCLE: "delivery",
  FOURGON: "van",
  CAMION: "van",
};

export function mapApiVehicleStatus(status?: string | null): VehicleApprovalStatus {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "approved" || key === "active") return "approved";
  if (key === "rejected") return "rejected";
  if (key === "draft") return "draft";
  return "pending";
}

export function mapCategoryCode(code?: string): VehicleCategory {
  if (!code) return "taxi";
  return CATEGORY_CODE_TO_UI[code.toUpperCase()] ?? "taxi";
}

function resolveDriverName(item: ApiV1VehicleItem): string | null {
  const d = (item as unknown as {
    driver?: {
      name?: string | null;
      displayName?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      profile?: { firstName?: string | null; lastName?: string | null; displayName?: string | null } | null;
    } | null;
    driverSummary?: { driverName?: string | null } | null;
  });
  const drv = d.driver;
  const fromParts =
    drv?.first_name && drv?.last_name ? `${drv.first_name} ${drv.last_name}`.trim() : null;
  const fromProfile =
    drv?.profile?.firstName && drv?.profile?.lastName
      ? `${drv.profile.firstName} ${drv.profile.lastName}`.trim()
      : null;

  // Priorité au nom complet (displayName / nom+prénom) plutôt qu'au seul prénom.
  const name =
    drv?.displayName?.trim() ||
    drv?.profile?.displayName?.trim() ||
    d.driverSummary?.driverName?.trim() ||
    fromParts ||
    fromProfile ||
    drv?.name?.trim() ||
    drv?.first_name?.trim() ||
    drv?.last_name?.trim() ||
    null;
  if (name) return name;
  // L'API ne renvoie souvent que driver_id (sans objet driver) : éviter d'afficher « — »
  // pour un véhicule réellement affecté.
  if (item.driver_id) return "Assigné";
  return null;
}

function readLabelParts(
  item: ApiV1VehicleItem,
  lookups?: VehicleCatalogLookups
): { brand: string; model: string; color: string; categoryLabel: string; categoryCode?: string } {
  const brand =
    item.brand?.label ??
    item.brandLabel ??
    (item.brand_id ? lookups?.brandById.get(item.brand_id)?.label ?? "" : "");
  const model =
    item.model?.label ??
    item.modelLabel ??
    (item.model_id ? lookups?.modelById.get(item.model_id)?.label ?? "" : "");
  const color =
    item.color?.label ??
    item.colorLabel ??
    (item.color_id ? lookups?.colorById.get(item.color_id)?.label ?? "" : "");
  const categoryCode =
    item.category?.code ??
    item.categoryCode ??
    (item.category_id ? lookups?.categoryById.get(item.category_id)?.code : undefined);
  const categoryLabel =
    item.category?.label ??
    item.categoryLabel ??
    (item.category_id ? lookups?.categoryById.get(item.category_id)?.label ?? "—" : "—");

  return { brand, model, color, categoryLabel, categoryCode };
}

export function mapApiVehicleToVehicle(
  item: ApiV1VehicleItem,
  lookups?: VehicleCatalogLookups
): Vehicle {
  const parts = readLabelParts(item, lookups);
  const brandModelLabel = [parts.brand, parts.model].filter(Boolean).join(" ").trim();
  const label =
    brandModelLabel ||
    (item.plate_number?.trim() ? item.plate_number.trim() : `Véhicule ${String(item.id).slice(0, 8)}`);

  return {
    id: item.id,
    label,
    plate: item.plate_number?.trim() ?? "",
    brand: parts.brand || undefined,
    model: parts.model || undefined,
    category: mapCategoryCode(parts.categoryCode),
    category_code: parts.categoryCode ?? undefined,
    category_label: parts.categoryLabel,
    year: item.manufacture_year ?? 0,
    color: parts.color || "—",
    driver_name: resolveDriverName(item),
    approval_status: mapApiVehicleStatus(item.status),
    created_at: item.created_at ?? new Date().toISOString(),
    partner_id: item.partner_id ?? null,
    partner_name:
      item.partner?.tradeName ??
      item.partner?.trade_name ??
      item.partnerName ??
      item.partner_name ??
      (item.partner_id ? lookups?.partnerNameById.get(item.partner_id) ?? null : null),
  };
}

export function mapApiVehicleToVehicleDetail(
  item: ApiV1VehicleItem,
  lookups?: VehicleCatalogLookups
): VehicleDetail {
  const base = mapApiVehicleToVehicle(item, lookups);
  const parts = readLabelParts(item, lookups);

  return {
    ...base,
    brand: parts.brand || "—",
    model: parts.model || "—",
    seats: item.seats_count ?? 0,
    owner_id: item.partner_id ?? "",
    registration_document: {
      id: "pending",
      type: "registration",
      label: "Carte grise",
      status: "pending",
      uploaded_at: item.created_at ?? new Date().toISOString(),
      reviewed_at: null,
    },
    approved_at: item.approved_at ?? null,
  };
}

export function mapAdminVehiclesToPaginated(
  items: ApiV1VehicleItem[],
  params: ListParams | undefined,
  pagination: ApiV1Pagination | undefined,
  lookups?: VehicleCatalogLookups
): Paginated<Vehicle> {
  const mapped = items.map((item) => mapApiVehicleToVehicle(item, lookups));

  if (pagination?.total != null || pagination?.page != null) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(pagination, params),
    };
  }

  return paginateClientList(mapped, params);
}

/** Mappe les catégories UI partenaire (mock) vers les codes catalogue v1. */
export function mapUiCategoryToApiCode(category: VehicleCategory): string {
  switch (category) {
    case "premium":
      return "PREMIUM";
    case "delivery":
      return "ECO";
    case "van":
      return "CONFORT";
    default:
      return "ECO";
  }
}

export interface PartnerFreeTextVehiclePayload {
  partnerId: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate?: string;
}

export function mapPartnerFreeTextToApiBody(payload: PartnerFreeTextVehiclePayload) {
  return {
    partnerId: payload.partnerId,
    categoryCode: mapUiCategoryToApiCode(payload.category),
    brand: payload.brand.trim(),
    model: payload.model.trim(),
    color: payload.color.trim(),
    manufactureYear: payload.year,
    plateNumber: payload.plate?.trim() || undefined,
  };
}
