"use client";

import { useMemo, useState } from "react";
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
import type { TripsScopeFilterOptions } from "@/shared/types";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";

type DateRangeState = ReturnType<typeof useDateRangeFilter>;

interface ServiceOption {
  value: string;
  label: string;
}

interface FranchiseTripsFiltersPanelProps {
  filterOptions?: TripsScopeFilterOptions;
  scope: FranchiseLiveMapFiltersValue;
  onScopeChange: (next: FranchiseLiveMapFiltersValue) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  serviceOptions: ServiceOption[];
  statusFilter: TripStatus | "all";
  onStatusFilterChange: (value: TripStatus | "all") => void;
  statusOptions: { value: TripStatus | "all"; label: string }[];
  dateRange: DateRangeState;
  search: string;
  onSearchChange: (value: string) => void;
  totalLabel?: string;
  hasActiveFilters: boolean;
  onResetAll: () => void;
}

export function FranchiseTripsFiltersPanel({
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
  totalLabel,
  hasActiveFilters,
  onResetAll,
}: FranchiseTripsFiltersPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const partnerName = useMemo(() => {
    if (scope.partnerId == null) return null;
    return (
      filterOptions?.partners.find((p) => String(p.id) === String(scope.partnerId))?.name ?? null
    );
  }, [filterOptions?.partners, scope.partnerId]);

  const serviceLabel =
    serviceOptions.find((opt) => opt.value === serviceFilter)?.label ?? "Tous services";
  const statusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ?? "Tous statuts";

  const compactSummary = [
    partnerName ?? "Tous les partenaires",
    serviceLabel,
    statusLabel,
    dateRange.rangeLabel,
  ]
    .filter(Boolean)
    .join(" · ");

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
              placeholder="Réf., client, chauffeur, adresse…"
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FilterField label="Partenaire" className="min-w-0 flex-1">
                <select
                  value={scope.partnerId ?? ""}
                  onChange={(e) =>
                    onScopeChange({
                      partnerId: e.target.value === "" ? null : e.target.value,
                    })
                  }
                  className={FILTER_SELECT_CLASS}
                >
                  <option value="">Tous les partenaires</option>
                  {filterOptions?.partners.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FilterField>
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
            {scope.partnerId != null && (
              <button
                type="button"
                onClick={() => onScopeChange({ partnerId: null })}
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
