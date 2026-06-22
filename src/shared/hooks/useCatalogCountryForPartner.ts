"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchBootstrapFoundation,
  resolveCatalogCountryForPartner,
  type CatalogCountry,
} from "@/core/api/catalogLookup.service";

export function useCatalogCountryForPartner(options: {
  franchiseCountryId?: string | null;
  cityId?: string | null;
  cityLabel?: string | null;
  enabled?: boolean;
}) {
  const enabled = options.enabled !== false;
  const franchiseCountryId = options.franchiseCountryId ?? null;
  const cityId = options.cityId ?? null;
  const cityLabel = options.cityLabel ?? null;

  return useQuery<CatalogCountry | null>({
    queryKey: [
      "catalog",
      "country-for-partner",
      franchiseCountryId,
      cityId,
      cityLabel,
    ],
    queryFn: async () => {
      const foundation = await fetchBootstrapFoundation();
      return resolveCatalogCountryForPartner(foundation, {
        franchiseCountryId,
        cityId,
        cityLabel,
      });
    },
    enabled,
    staleTime: 10 * 60_000,
  });
}
