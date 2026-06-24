"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "./useDebouncedValue";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type { DataTableServerPagination } from "@/shared/ui/DataTable";

const DEFAULT_PAGE_SIZE = 25;

/** Lit la valeur initiale de `page` depuis l'URL (>= 1). */
function readInitialPage(params: URLSearchParams): number {
  const raw = params.get("page");
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Lit la valeur initiale de `per_page` depuis l'URL (>= 1). */
function readInitialPageSize(params: URLSearchParams, fallback: number): number {
  const raw = params.get("per_page");
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

/**
 * État de table serveur (pagination + recherche debouncée) miroir de l'URL.
 *
 * Au montage, l'état est initialisé depuis l'URL (`?page`, `?per_page`,
 * `?search` + les filtres principaux passés via `extraParams`). À chaque
 * changement, l'URL est réécrite via `router.replace` (shallow, sans scroll).
 *
 * L'API publique (valeurs/setters retournés, `listParams`) est inchangée :
 * les consommateurs existants n'ont rien à modifier.
 */
export function useServerTableState(
  resetDeps: unknown[] = [],
  extraParams: Partial<ListParams> = {},
  defaultPageSize = DEFAULT_PAGE_SIZE
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialisation depuis l'URL (une seule fois, au montage).
  const initialParams = useRef(searchParams);
  const [page, setPage] = useState(() => readInitialPage(initialParams.current));
  const [pageSize, setPageSize] = useState(() =>
    readInitialPageSize(initialParams.current, defaultPageSize)
  );
  const [search, setSearch] = useState(() => initialParams.current.get("search") ?? "");
  const debouncedSearch = useDebouncedValue(search);

  // Évite de réinitialiser la page au tout premier rendu (sinon une URL
  // arrivant avec `?page=3` serait immédiatement ramenée à 1).
  const firstResetRun = useRef(true);
  useEffect(() => {
    if (firstResetRun.current) {
      firstResetRun.current = false;
      return;
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, pageSize, ...resetDeps]);

  const listParams: ListParams = {
    page,
    per_page: pageSize,
    search: debouncedSearch || undefined,
    ...extraParams,
  };

  // Sérialise les filtres principaux pour une dépendance d'effet stable
  // (l'objet `extraParams` est recréé à chaque rendu côté consommateur).
  const extraEntries = Object.entries(extraParams)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  const extraKey = JSON.stringify(extraEntries);

  // Écrit l'état dans l'URL à chaque changement (miroir).
  useEffect(() => {
    const qs = new URLSearchParams();
    if (page > 1) qs.set("page", String(page));
    if (pageSize !== defaultPageSize) qs.set("per_page", String(pageSize));
    if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());
    for (const [k, v] of JSON.parse(extraKey) as [string, string][]) {
      if (v !== "all") qs.set(k, v);
    }

    const query = qs.toString();
    if (query === window.location.search.replace(/^\?/, "")) return;

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, extraKey, defaultPageSize, pathname, router]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    debouncedSearch,
    listParams,
  };
}

export function serverPaginationFromMeta<T>(
  meta: Paginated<T>["meta"] | undefined,
  setPage: (p: number) => void,
  setPageSize: (s: number) => void
): DataTableServerPagination | undefined {
  if (!meta) return undefined;
  return {
    page: meta.current_page,
    pageSize: meta.per_page,
    total: meta.total,
    lastPage: meta.last_page,
    onPageChange: setPage,
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };
}
