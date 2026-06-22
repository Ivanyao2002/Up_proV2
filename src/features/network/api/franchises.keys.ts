import type { ListParams } from "@/shared/types/listParams";

export const franchisesKeys = {
  all: ["network", "franchises"] as const,
  list: (filters?: ListParams) => [...franchisesKeys.all, "list", filters] as const,
  bootstrapCities: ["network", "franchises", "bootstrap-cities"] as const,
  bootstrapCountries: ["network", "franchises", "bootstrap-countries"] as const,
  countryCities: (countryCode: string, query?: string) =>
    ["network", "franchises", "country-cities", countryCode, query ?? ""] as const,
};
