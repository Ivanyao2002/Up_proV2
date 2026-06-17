"use client";

import { useMemo, useState } from "react";
import type { TripsScopeFilterOptions } from "@/shared/types";
import type { TripStatus } from "@/shared/types";
import { Button } from "@/shared/ui/Button";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { FilterChips } from "@/shared/ui/FilterChips";
import { FilterField } from "@/shared/ui/FilterField";
import { FILTER_SELECT_CLASS } from "@/shared/ui/filterControlStyles";
import { SearchInput } from "@/shared/ui/SearchInput";
import {
  TableFiltersPanel,
  TableFiltersSection,
} from "@/shared/ui/TableFiltersPanel";
import type { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { TripsScopeFields } from "./TripsScopeFields";
import type { TripsScopeFiltersValue } from "./TripsScopeFilters";

type DateRangeState = ReturnType<typeof useDateRangeFilter>;

interface ServiceOption {
  value: string;
  label: string;
}

interface AdminTripsFiltersPanelProps {
  filterOptions: TripsScopeFilterOptions;
  scope: TripsScopeFiltersValue;
  onScopeChange: (next: TripsScopeFiltersValue) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  serviceOptions: ServiceOption[];
  statusFilter: TripStatus | "all";
  onStatusFilterChange: (value: TripStatus | "all") => void;
  statusOptions: { value: TripStatus | "all"; label: string }[];
  dateRange: DateRangeState;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  totalLabel?: string;
  hasActiveFilters: boolean;
  onResetAll: () => void;
}

export function AdminTripsFiltersPanel({
  filterOptions,
  scope,
  onScopeChange,
  serviceFilter,
  onServiceFilterChange,
  serviceOptions,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  dateRange,
  search,
  onSearchChange,
  searchPlaceholder = "Réf., client, chauffeur, adresse…",
  totalLabel,
  hasActiveFilters,
  onResetAll,
}: AdminTripsFiltersPanelProps) {
  const scopeActive =
    scope.franchiseId != null || scope.partnerId != null;

  const [expanded, setExpanded] = useState(false);

  const scopeLabel = useMemo(() => {
    const franchiseName =
      scope.franchiseId != null
        ? filterOptions.franchises.find((f) => String(f.id) === String(scope.franchiseId))?.name
        : undefined;
    const partnerName =
      scope.partnerId != null
        ? filterOptions.partners.find((p) => String(p.id) === String(scope.partnerId))?.name
        : undefined;

    if (franchiseName && partnerName) return `${franchiseName} · ${partnerName}`;
    if (franchiseName) return franchiseName;
    if (partnerName) return partnerName;
    return "Mondiale — toutes franchises";
  }, [filterOptions.franchises, filterOptions.partners, scope.franchiseId, scope.partnerId]);

  const serviceLabel =
    serviceOptions.find((opt) => opt.value === serviceFilter)?.label ?? "Tous services";

  const statusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ?? "Tous statuts";

  const compactSummary = `${scopeLabel} · ${serviceLabel} · ${statusLabel} · ${dateRange.rangeLabel}`;

  return (
    <TableFiltersPanel>
      <TableFiltersSection
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                className="!h-auto !px-2.5 !py-1.5 !text-xs text-teal hover:text-teal-dark"
                onClick={onResetAll}
              >
                Réinitialiser
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="!px-3 !py-2 !text-xs"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Masquer les filtres" : "Filtres"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField label="Recherche" className="min-w-0 flex-1 sm:min-w-[280px]">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="max-w-none"
            />
          </FilterField>
          {totalLabel ? (
            <p className="flex min-h-[42px] items-center text-sm text-muted tabular-nums">
              {totalLabel}
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">{compactSummary}</p>
      </TableFiltersSection>

      {expanded ? (
        <>
          <TableFiltersSection title="Périmètre">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TripsScopeFields
                options={filterOptions}
                value={scope}
                onChange={onScopeChange}
              />
              <FilterField label="Service" className="min-w-0 flex-1">
                <select
                  value={serviceFilter}
                  onChange={(e) => onServiceFilterChange(e.target.value)}
                  className={FILTER_SELECT_CLASS}
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FilterField>
            </div>
            {scopeActive && (
              <button
                type="button"
                onClick={() => onScopeChange({ franchiseId: null, partnerId: null })}
                className="mt-3 text-xs font-medium text-teal hover:text-teal-dark"
              >
                Réinitialiser le périmètre
              </button>
            )}
          </TableFiltersSection>

          <TableFiltersSection title="Statut">
            <FilterChips
              options={statusOptions}
              value={statusFilter}
              onChange={onStatusFilterChange}
            />
          </TableFiltersSection>

          <TableFiltersSection title="Période">
            <DateRangeFilter
              hideLabel
              preset={dateRange.preset}
              onPresetChange={dateRange.setPreset}
              customFrom={dateRange.customFrom}
              customTo={dateRange.customTo}
              onCustomFromChange={dateRange.setCustomFrom}
              onCustomToChange={dateRange.setCustomTo}
              rangeLabel={dateRange.rangeLabel}
              className="w-full"
            />
          </TableFiltersSection>
        </>
      ) : null}
    </TableFiltersPanel>
  );
}
