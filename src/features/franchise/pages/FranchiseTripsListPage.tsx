"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterChips } from "@/shared/ui/FilterChips";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import {
  getServiceLabel,
  getTripStatusLabel,
  STATUS_FILTER_OPTIONS,
} from "@/shared/lib/tripLabels";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import type { Trip, TripStatus } from "@/shared/types";
import { FranchiseLiveMapPartnerFilter } from "../components/FranchiseLiveMapPartnerFilter";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";
import { useFranchiseTripsList } from "../api/trips.queries";

const SERVICE_OPTIONS = [
  { value: "all" as const, label: "Tous services" },
  { value: "taxi", label: "Taxi" },
  { value: "delivery", label: "Livraison" },
  { value: "rental", label: "Location" },
  { value: "freight", label: "Fret" },
];

export function FranchiseTripsListPage() {
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [serviceFilter, setServiceFilter] =
    useState<(typeof SERVICE_OPTIONS)[number]["value"]>("all");
  const [scope, setScope] = useState<FranchiseLiveMapFiltersValue>({
    partnerId: null,
  });

  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });

  const table = useServerTableState(
    [statusFilter, serviceFilter, scope.partnerId, dateRange.dateFrom, dateRange.dateTo],
    {
      service: serviceFilter !== "all" ? serviceFilter : undefined,
      partner_id: scope.partnerId ?? undefined,
      ...dateRange.listParams,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: serviceFilter, defaultValue: "all", reset: () => setServiceFilter("all") },
      {
        value: scope.partnerId != null,
        defaultValue: false,
        reset: () => setScope({ partnerId: null }),
      },
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = useFranchiseTripsList(
    statusFilter,
    table.listParams
  );

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const filterOptions = data?.filter_options;
  const showPartnerColumn = scope.partnerId == null;

  const columns: Column<Trip>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <Link
          href={`/franchise/trips/${t.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {t.ref}
        </Link>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "service",
      header: "Service",
      cell: (t) => <ServicePill service={t.service} />,
      exportValue: (t) => getServiceLabel(t.service),
    },
    {
      id: "route",
      header: "Trajet",
      cell: (t) => (
        <div className="max-w-[220px]">
          <span className="block truncate text-foreground">{t.from_label}</span>
          <span className="block truncate text-xs text-muted">→ {t.to_label}</span>
        </div>
      ),
      exportValue: (t) => `${t.from_label} → ${t.to_label}`,
    },
    {
      id: "client",
      header: "Client",
      cell: (t) => t.client_name,
      exportValue: (t) => t.client_name,
    },
    ...(showPartnerColumn
      ? [
          {
            id: "partner",
            header: "Partenaire",
            cell: (t: Trip) =>
              t.partner_id != null ? (
                <Link
                  href={`/franchise/partners/${t.partner_id}`}
                  className="text-sm text-foreground hover:text-teal"
                >
                  {t.partner_name ?? `Partenaire ${t.partner_id}`}
                </Link>
              ) : (
                "—"
              ),
            exportValue: (t: Trip) => t.partner_name ?? "",
          } satisfies Column<Trip>,
        ]
      : []),
    {
      id: "driver",
      header: "Chauffeur",
      cell: (t) => t.driver_name ?? "—",
      exportValue: (t) => t.driver_name ?? "",
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums whitespace-nowrap",
      cell: (t) => formatFCFA(t.amount_fcfa),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => (
        <StatusPill status={t.status} pulse={t.status === "in_progress"} />
      ),
      exportValue: (t) => getTripStatusLabel(t.status),
    },
    {
      id: "date",
      header: "Date",
      className: "text-muted whitespace-nowrap",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => formatDateTime(t.created_at),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les courses.{" "}
        <Link href="/franchise/trips" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader title="Courses" breadcrumb={["Franchise", "Courses"]} />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total.toLocaleString("fr-CI")} courses sur le territoire
          </p>
        )}
      </div>

      {filterOptions && (
        <FranchiseLiveMapPartnerFilter
          options={filterOptions}
          value={scope}
          onChange={setScope}
        />
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., client, chauffeur, adresse…"
        totalLabel={
          meta ? `${meta.total.toLocaleString("fr-CI")} courses` : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <SelectFilter
          label="Service"
          value={serviceFilter}
          onChange={setServiceFilter}
          options={SERVICE_OPTIONS}
        />
        <DateRangeFilter
          preset={dateRange.preset}
          onPresetChange={dateRange.setPreset}
          customFrom={dateRange.customFrom}
          customTo={dateRange.customTo}
          onCustomFromChange={dateRange.setCustomFrom}
          onCustomToChange={dateRange.setCustomTo}
          rangeLabel={dateRange.rangeLabel}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="courses-franchise"
        emptyTitle="Aucune course"
        emptyDescription="Aucun résultat pour ces filtres."
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
