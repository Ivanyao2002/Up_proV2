import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";

export interface CatalogCountry {
  id: string;
  code: string;
  dial_code: string;
  label: string;
  flag_url?: string | null;
}

export interface CatalogCity {
  id: string;
  label: string;
  slug?: string | null;
  country_id: string;
}

export interface BootstrapFoundation {
  countries: CatalogCountry[];
  cities: CatalogCity[];
}

interface BootstrapCountry {
  id: string;
  code?: string | null;
  dial_code?: string | null;
  label_fr?: string | null;
  label_en?: string | null;
  flag_url?: string | null;
  active?: boolean;
}

interface BootstrapCity {
  id: string;
  country_id?: string | null;
  label?: string | null;
  slug?: string | null;
  active?: boolean;
}

interface CatalogBootstrapResponse {
  catalogs?: {
    foundation?: {
      countries?: BootstrapCountry[];
      cities?: BootstrapCity[];
    };
  };
}

let foundationCache: BootstrapFoundation | null = null;
let cityByIdCache: Map<string, string> | null = null;
let franchiseNameByIdCache: Map<string, string> | null = null;

function mapBootstrapCountry(country: BootstrapCountry): CatalogCountry | null {
  const label = country.label_fr?.trim() || country.label_en?.trim() || country.code?.trim();
  if (!country.id || !label || !country.dial_code?.trim()) return null;
  return {
    id: country.id,
    code: country.code?.trim() ?? "",
    dial_code: country.dial_code.trim(),
    label,
    flag_url: country.flag_url ?? null,
  };
}

function mapBootstrapCity(city: BootstrapCity): CatalogCity | null {
  const label = city.label?.trim() || city.slug?.trim();
  if (!city.id || !label || !city.country_id) return null;
  return {
    id: city.id,
    label,
    slug: city.slug ?? null,
    country_id: city.country_id,
  };
}

/** Pays + villes depuis `GET /v1/catalog/bootstrap`. */
export async function fetchBootstrapFoundation(): Promise<BootstrapFoundation> {
  if (foundationCache) return foundationCache;

  const boot = await apiClient.get<CatalogBootstrapResponse>(
    LINKS.v1.catalog.bootstrap
  );
  const foundation = boot.catalogs?.foundation;

  const countries = (foundation?.countries ?? [])
    .filter((item) => item.active !== false)
    .map(mapBootstrapCountry)
    .filter((item): item is CatalogCountry => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const cities = (foundation?.cities ?? [])
    .filter((item) => item.active !== false)
    .map(mapBootstrapCity)
    .filter((item): item is CatalogCity => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  foundationCache = { countries, cities };
  cityByIdCache = new Map(cities.map((city) => [city.id, city.label]));
  return foundationCache;
}

/** Liste des villes depuis le bootstrap (tri alphabétique). */
export async function fetchBootstrapCities(): Promise<CatalogCity[]> {
  return (await fetchBootstrapFoundation()).cities;
}

/** Liste des pays depuis le bootstrap (tri alphabétique). */
export async function fetchBootstrapCountries(): Promise<CatalogCountry[]> {
  return (await fetchBootstrapFoundation()).countries;
}

interface CountryCitiesResponse {
  status?: string;
  country?: BootstrapCountry;
  items?: BootstrapCity[];
}

/** Villes d'un pays via `GET /v1/catalog/countries/{code}/cities?q=`. */
export async function fetchCitiesByCountryCode(
  countryCode: string,
  query = ""
): Promise<CatalogCity[]> {
  if (!countryCode.trim()) return [];

  const response = await apiClient.get<CountryCitiesResponse>(
    `${LINKS.v1.catalog.countryCities(countryCode)}?q=${encodeURIComponent(query.trim())}`
  );

  const countryId = response.country?.id ?? "";
  return (response.items ?? [])
    .filter((item) => item.active !== false)
    .map((item) =>
      mapBootstrapCity({
        ...item,
        country_id: item.country_id ?? countryId,
      })
    )
    .filter((item): item is CatalogCity => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function buildInternationalPhone(
  dialCode: string,
  localNumber: string
): string {
  const code = dialCode.trim().startsWith("+")
    ? dialCode.trim()
    : `+${dialCode.trim()}`;
  let digits = localNumber.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `${code}${digits}`;
}

/** Partie locale d'un numéro déjà au format international. */
export function extractLocalPhonePart(
  internationalPhone: string,
  dialCode: string
): string {
  const code = dialCode.trim().startsWith("+")
    ? dialCode.trim()
    : `+${dialCode.trim()}`;
  const compact = internationalPhone.replace(/\s/g, "");
  if (!compact) return "";
  if (compact.startsWith(code)) {
    const rest = compact.slice(code.length);
    if (!rest) return "";
    return rest.startsWith("0") ? rest : `0${rest}`;
  }
  return internationalPhone;
}

/** Pays catalogue déduit du contexte partenaire (franchise, ville). */
export function resolveCatalogCountryForPartner(
  foundation: BootstrapFoundation,
  options: {
    franchiseCountryId?: string | null;
    cityId?: string | null;
    cityLabel?: string | null;
  }
): CatalogCountry | null {
  const { countries, cities } = foundation;

  const franchiseCountryId = options.franchiseCountryId?.trim();
  if (franchiseCountryId) {
    const byFranchise = countries.find((c) => c.id === franchiseCountryId);
    if (byFranchise) return byFranchise;
  }

  const cityId = options.cityId?.trim();
  if (cityId) {
    const city = cities.find((c) => c.id === cityId);
    if (city) {
      const byCityId = countries.find((c) => c.id === city.country_id);
      if (byCityId) return byCityId;
    }
  }

  const normalized = options.cityLabel?.trim().toLowerCase();
  if (normalized && normalized !== "—") {
    const city =
      cities.find((c) => c.label.toLowerCase() === normalized) ??
      cities.find((c) => c.label.toLowerCase().includes(normalized));
    if (city) {
      const byLabel = countries.find((c) => c.id === city.country_id);
      if (byLabel) return byLabel;
    }
  }

  return null;
}

/** Résout un cityId depuis le libellé (ex. « Abidjan »). */
export async function resolveCityIdByLabel(
  cityLabel: string
): Promise<string | undefined> {
  const normalized = cityLabel.trim().toLowerCase();
  if (!normalized) return undefined;

  const cities = await fetchBootstrapCities();
  const exact = cities.find((city) => city.label.toLowerCase() === normalized);
  if (exact) return exact.id;

  return cities.find((city) =>
    city.label.toLowerCase().includes(normalized)
  )?.id;
}

export async function fetchCityLabelById(): Promise<Map<string, string>> {
  if (cityByIdCache) return cityByIdCache;
  const cities = await fetchBootstrapCities();
  cityByIdCache = new Map(cities.map((city) => [city.id, city.label]));
  return cityByIdCache;
}

export async function fetchFranchiseNameById(): Promise<Map<string, string>> {
  if (franchiseNameByIdCache) return franchiseNameByIdCache;

  try {
    const dash = await apiClient.get<ApiAdminDashboardResponse>(
      LINKS.admin.v1.dashboard
    );
    const franchises = dash.dashboard?.filters?.options?.franchises ?? [];
    franchiseNameByIdCache = new Map(
      franchises
        .filter((f) => f.id && f.name)
        .map((f) => [String(f.id), f.name!.trim()])
    );
  } catch {
    franchiseNameByIdCache = new Map();
  }

  return franchiseNameByIdCache;
}

export async function fetchNetworkLookups(): Promise<{
  cityById: Map<string, string>;
  franchiseNameById: Map<string, string>;
}> {
  const [cityById, franchiseNameById] = await Promise.all([
    fetchCityLabelById(),
    fetchFranchiseNameById(),
  ]);
  return { cityById, franchiseNameById };
}

export function clearBootstrapFoundationCache(): void {
  foundationCache = null;
  cityByIdCache = null;
}
