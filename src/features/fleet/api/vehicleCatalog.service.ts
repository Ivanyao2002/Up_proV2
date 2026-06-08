import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { ApiAdminPartnersResponse } from "@/features/network/api/adminPartners.api.types";
import type {
  ApiCatalogBrandModelsResponse,
  ApiCatalogListResponse,
  ApiCatalogVehicleBrand,
  ApiCatalogVehicleCategory,
  ApiCatalogVehicleColor,
  ApiCatalogVehicleModel,
  ApiV1VehicleItem,
} from "./adminVehicles.api.types";

export interface VehicleCatalogLookups {
  categoryById: Map<string, { code: string; label: string }>;
  categoryByCode: Map<string, { id: string; label: string }>;
  brandById: Map<string, { code: string; label: string }>;
  modelById: Map<string, { label: string; code: string }>;
  colorById: Map<string, { code: string; label: string }>;
  partnerNameById: Map<string, string>;
}

type BaseVehicleCatalogLookups = Omit<VehicleCatalogLookups, "modelById">;

let baseCatalogCache: BaseVehicleCatalogLookups | null = null;
const modelsByBrandCache = new Map<string, ApiCatalogVehicleModel[]>();

export async function fetchVehicleCategories(): Promise<ApiCatalogVehicleCategory[]> {
  const response = await apiClient.get<ApiCatalogListResponse<ApiCatalogVehicleCategory>>(
    LINKS.v1.catalog.vehicleCategories
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

export async function fetchVehicleBrands(): Promise<ApiCatalogVehicleBrand[]> {
  const response = await apiClient.get<ApiCatalogListResponse<ApiCatalogVehicleBrand>>(
    `${LINKS.v1.catalog.vehicleBrands}?limit=100`
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

export async function fetchVehicleBrandModels(
  brandCode: string
): Promise<ApiCatalogVehicleModel[]> {
  if (!brandCode.trim()) return [];

  const cached = modelsByBrandCache.get(brandCode);
  if (cached) return cached;

  const response = await apiClient.get<ApiCatalogBrandModelsResponse>(
    `${LINKS.v1.catalog.vehicleBrandModels(brandCode)}?limit=100`
  );
  const models = (response.items ?? []).filter((item) => item.active !== false);
  modelsByBrandCache.set(brandCode, models);
  return models;
}

export async function fetchVehicleColors(): Promise<ApiCatalogVehicleColor[]> {
  const response = await apiClient.get<ApiCatalogListResponse<ApiCatalogVehicleColor>>(
    `${LINKS.v1.catalog.vehicleColors}?limit=50`
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

async function fetchPartnerNameById(): Promise<Map<string, string>> {
  try {
    const response = await apiClient.get<ApiAdminPartnersResponse>(
      `${LINKS.admin.v1.partners}?limit=200`
    );
    return new Map(
      (response.items ?? []).map((item) => [
        String(item.id),
        item.name ?? item.trade_name ?? item.legal_name ?? String(item.id),
      ])
    );
  } catch {
    return new Map();
  }
}

async function fetchBaseVehicleCatalogLookups(): Promise<BaseVehicleCatalogLookups> {
  if (baseCatalogCache) return baseCatalogCache;

  const [categories, brands, colors, partnerNameById] = await Promise.all([
    fetchVehicleCategories(),
    fetchVehicleBrands(),
    fetchVehicleColors(),
    fetchPartnerNameById(),
  ]);

  const categoryById = new Map<string, { code: string; label: string }>();
  const categoryByCode = new Map<string, { id: string; label: string }>();
  for (const category of categories) {
    categoryById.set(category.id, { code: category.code, label: category.label });
    categoryByCode.set(category.code, { id: category.id, label: category.label });
  }

  const brandById = new Map<string, { code: string; label: string }>();
  for (const brand of brands) {
    brandById.set(brand.id, { code: brand.code, label: brand.label });
  }

  const colorById = new Map<string, { code: string; label: string }>();
  for (const color of colors) {
    colorById.set(color.id, { code: color.code, label: color.label });
  }

  baseCatalogCache = {
    categoryById,
    categoryByCode,
    brandById,
    colorById,
    partnerNameById,
  };

  return baseCatalogCache;
}

export function extractBrandCodesFromItems(
  items: ApiV1VehicleItem[],
  base: Pick<BaseVehicleCatalogLookups, "brandById">
): string[] {
  const codes = new Set<string>();
  for (const item of items) {
    if (!item.brand_id) continue;
    const brand = base.brandById.get(item.brand_id);
    if (brand?.code) codes.add(brand.code);
  }
  return [...codes];
}

export async function fetchModelByIdMapForBrandCodes(
  brandCodes: string[]
): Promise<Map<string, { label: string; code: string }>> {
  const uniqueCodes = [...new Set(brandCodes.map((code) => code.trim()).filter(Boolean))];
  if (!uniqueCodes.length) return new Map();

  const modelById = new Map<string, { label: string; code: string }>();
  const modelsPerBrand = await Promise.all(
    uniqueCodes.map((brandCode) => fetchVehicleBrandModels(brandCode))
  );

  for (const models of modelsPerBrand) {
    for (const model of models) {
      modelById.set(model.id, { label: model.label, code: model.code });
    }
  }

  return modelById;
}

/** Catalogue sans modèles — pour les formulaires (marques / couleurs / catégories). */
export async function fetchVehicleCatalogLookups(): Promise<VehicleCatalogLookups> {
  const base = await fetchBaseVehicleCatalogLookups();
  return { ...base, modelById: new Map() };
}

/** Charge les modèles uniquement pour les marques concernées (liste, détail). */
export async function fetchVehicleCatalogLookupsForItems(
  items: ApiV1VehicleItem[]
): Promise<VehicleCatalogLookups> {
  const base = await fetchBaseVehicleCatalogLookups();
  const brandCodes = extractBrandCodesFromItems(items, base);
  const modelById = await fetchModelByIdMapForBrandCodes(brandCodes);
  return { ...base, modelById };
}

/** Charge les modèles d'une seule marque (création véhicule après POST). */
export async function fetchVehicleCatalogLookupsForBrand(
  brandCode: string
): Promise<VehicleCatalogLookups> {
  const base = await fetchBaseVehicleCatalogLookups();
  const modelById = await fetchModelByIdMapForBrandCodes([brandCode]);
  return { ...base, modelById };
}

export function clearVehicleCatalogCache(): void {
  baseCatalogCache = null;
  modelsByBrandCache.clear();
}
