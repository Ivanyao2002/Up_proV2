"use client";

import { useMemo, useState } from "react";
import type { Driver } from "@/shared/types";
import {
  DRIVER_ACCOUNT_STATUS_FILTER_OPTIONS,
  DRIVER_AVAILABILITY_FILTER_OPTIONS,
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import { Button } from "@/shared/ui/Button";
import { FilterChips } from "@/shared/ui/FilterChips";
import { FilterField } from "@/shared/ui/FilterField";
import { SearchInput } from "@/shared/ui/SearchInput";
import {
  TableFiltersPanel,
  TableFiltersSection,
} from "@/shared/ui/TableFiltersPanel";

interface PartnerDriversFiltersPanelProps {
  accountStatusFilter: Driver["account_status"] | "all";
  onAccountStatusFilterChange: (value: Driver["account_status"] | "all") => void;
  availabilityFilter: Driver["availability"] | "all";
  onAvailabilityFilterChange: (value: Driver["availability"] | "all") => void;
  showAccountStatusFilters?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  totalLabel?: string;
  hasActiveFilters: boolean;
  onResetAll: () => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PartnerDriversFiltersPanel({
  accountStatusFilter,
  onAccountStatusFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  showAccountStatusFilters = true,
  search,
  onSearchChange,
  searchPlaceholder = "Nom, téléphone…",
  totalLabel,
  hasActiveFilters,
  onResetAll,
}: PartnerDriversFiltersPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const activeSummary = useMemo(() => {
    const items: string[] = [];

    if (showAccountStatusFilters && accountStatusFilter !== "all") {
      items.push(getDriverAccountStatusLabel(accountStatusFilter));
    }

    if (availabilityFilter !== "all") {
      items.push(getDriverAvailabilityLabel(availabilityFilter));
    }

    if (search.trim()) {
      items.push(`« ${search.trim()} »`);
    }

    return items;
  }, [
    showAccountStatusFilters,
    accountStatusFilter,
    availabilityFilter,
    search,
  ]);

  const activeCount = activeSummary.length;

  return (
    <div className="mb-4 overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-canvas/80 via-surface to-canvas/40 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="group flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface shadow-sm">
            <svg
              className="h-4 w-4 text-teal"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h14M6 10h8M9 15h2"
              />
            </svg>
          </span>

          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Filtres</span>
              {activeCount > 0 && (
                <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-semibold text-teal-dark">
                  {activeCount} actif{activeCount > 1 ? "s" : ""}
                </span>
              )}
            </span>
            {!expanded && (
              <span className="mt-0.5 block truncate text-xs text-muted">
                {activeCount > 0
                  ? activeSummary.join(" · ")
                  : "Aucun filtre appliqué"}
              </span>
            )}
            {expanded && totalLabel && (
              <span className="mt-0.5 block text-xs text-muted tabular-nums">
                {totalLabel}
              </span>
            )}
          </span>

          <ChevronIcon open={expanded} />
        </button>

        <div className="flex items-center gap-2">
          {!expanded && activeCount > 0 && (
            <div className="hidden flex-wrap gap-1.5 md:flex">
              {activeSummary.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/80 bg-canvas/70 px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              className="!h-8 !px-2.5 !text-xs text-teal hover:text-teal-dark"
              onClick={onResetAll}
            >
              Réinitialiser
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            className="!h-8 !px-3 !text-xs"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Masquer" : "Afficher"}
          </Button>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <TableFiltersPanel className="!mb-0 !rounded-none !border-0 !shadow-none">
            {showAccountStatusFilters && (
              <TableFiltersSection title="Statut">
                <FilterChips
                  options={DRIVER_ACCOUNT_STATUS_FILTER_OPTIONS}
                  value={accountStatusFilter}
                  onChange={onAccountStatusFilterChange}
                />
              </TableFiltersSection>
            )}

            <TableFiltersSection title="Disponibilité">
              <FilterChips
                options={DRIVER_AVAILABILITY_FILTER_OPTIONS}
                value={availabilityFilter}
                onChange={onAvailabilityFilterChange}
              />
            </TableFiltersSection>

            <TableFiltersSection>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <FilterField label="Recherche" className="min-w-0 flex-1 sm:min-w-[280px]">
                  <SearchInput
                    value={search}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    className="max-w-none"
                  />
                </FilterField>
                {expanded && totalLabel && (
                  <p className="flex min-h-[42px] items-center text-sm text-muted tabular-nums sm:hidden">
                    {totalLabel}
                  </p>
                )}
              </div>
            </TableFiltersSection>
          </TableFiltersPanel>
        </div>
      </div>
    </div>
  );
}
