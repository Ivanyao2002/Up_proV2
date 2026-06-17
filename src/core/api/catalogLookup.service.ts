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

export interface CatalogFoundation {
  countries: CatalogCountry[];
  cities: CatalogCity[];
}

/** @deprecated Alias — préférer `CatalogFoundation`. */
export type BootstrapFoundation = CatalogFoundation;

interface CatalogCountryRow {
  id: string;
  code?: string | null;
  dial_code?: string | null;
  label_fr?: string | null;
  label_en?: string | null;
  flag_url?: string | null;
  active?: boolean;
}

interface CatalogCityRow {
  id: string;
  country_id?: string | null;
  label?: string | null;
  slug?: string | null;
  active?: boolean;
}

interface CatalogCountriesResponse {
  status?: string;
  items?: CatalogCountryRow[];
}

interface CountryCitiesResponse {
  status?: string;
  country?: CatalogCountryRow;
  items?: CatalogCityRow[];
}

let countriesCache: CatalogCountry[] | null = null;
let foundationCache: CatalogFoundation | null = null;
let cityByIdCache: Map<string, string> | null = null;
let franchiseNameByIdCache: Map<string, string> | null = null;

function mapCatalogCountry(country: CatalogCountryRow): CatalogCountry | null {
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

function mapCatalogCity(city: CatalogCityRow, countryIdFallback = ""): CatalogCity | null {
  const label = city.label?.trim() || city.slug?.trim();
  const countryId = city.country_id?.trim() || countryIdFallback;
  if (!city.id || !label || !countryId) return null;
  return {
    id: city.id,
    label,
    slug: city.slug ?? null,
    country_id: countryId,
  };
}

function sortCities(cities: CatalogCity[]): CatalogCity[] {
  return [...cities].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/** Liste des pays via `GET /v1/catalog/countries`. */
export async function fetchCatalogCountries(): Promise<CatalogCountry[]> {
  if (countriesCache) return countriesCache;

  const response = await apiClient.get<CatalogCountriesResponse>(
    LINKS.v1.catalog.countries
  );

  countriesCache = (response.items ?? [])
    .filter((item) => item.active !== false)
    .map(mapCatalogCountry)
    .filter((item): item is CatalogCountry => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return countriesCache;
}

/** @deprecated Utiliser `fetchCatalogCountries`. */
export const fetchBootstrapCountries = fetchCatalogCountries;

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
  return sortCities(
    (response.items ?? [])
      .filter((item) => item.active !== false)
      .map((item) => mapCatalogCity(item, countryId))
      .filter((item): item is CatalogCity => item !== null)
  );
}

async function fetchAllCatalogCities(
  countries: CatalogCountry[]
): Promise<CatalogCity[]> {
  const batches = await Promise.all(
    countries
      .filter((country) => country.code.trim())
      .map((country) => fetchCitiesByCountryCode(country.code))
  );
  return sortCities(batches.flat());
}

/** Pays + toutes les villes (routes catalogue dédiées, sans bootstrap). */
export async function fetchCatalogFoundation(): Promise<CatalogFoundation> {
  if (foundationCache) return foundationCache;

  const countries = await fetchCatalogCountries();
  const cities = await fetchAllCatalogCities(countries);

  foundationCache = { countries, cities };
  cityByIdCache = new Map(cities.map((city) => [city.id, city.label]));
  return foundationCache;
}

/** @deprecated Utiliser `fetchCatalogFoundation`. */
export const fetchBootstrapFoundation = fetchCatalogFoundation;

/** Toutes les villes catalogue (agrégation par pays). */
export async function fetchCatalogCities(): Promise<CatalogCity[]> {
  return (await fetchCatalogFoundation()).cities;
}

/** @deprecated Utiliser `fetchCatalogCities`. */
export const fetchBootstrapCities = fetchCatalogCities;

/** Déduit le code pays ISO depuis un libellé de ville (ex. « Abidjan » → `CI`). */
export async function resolveCountryCodeFromCityLabel(
  cityLabel: string
): Promise<string | undefined> {
  const normalized = cityLabel.trim().toLowerCase();
  if (!normalized || normalized === "—") return undefined;

  const countries = await fetchCatalogCountries();
  for (const country of countries) {
    if (!country.code.trim()) continue;
    const cities = await fetchCitiesByCountryCode(country.code);
    const match =
      cities.find((item) => item.label.toLowerCase() === normalized) ??
      cities.find((item) => item.label.toLowerCase().includes(normalized));
    if (match) return country.code;
  }
  return undefined;
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
  foundation: CatalogFoundation,
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

  const cities = await fetchCatalogCities();
  const exact = cities.find((city) => city.label.toLowerCase() === normalized);
  if (exact) return exact.id;

  return cities.find((city) =>
    city.label.toLowerCase().includes(normalized)
  )?.id;
}

export async function fetchCityLabelById(): Promise<Map<string, string>> {
  if (cityByIdCache) return cityByIdCache;
  const cities = await fetchCatalogCities();
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

export function clearCatalogFoundationCache(): void {
  countriesCache = null;
  foundationCache = null;
  cityByIdCache = null;
}

/** @deprecated Utiliser `clearCatalogFoundationCache`. */
export const clearBootstrapFoundationCache = clearCatalogFoundationCache;
