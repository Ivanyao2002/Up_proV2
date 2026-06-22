"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { useInitialUrlFilter } from "@/shared/hooks/useInitialUrlFilter";
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
import type { Trip, TripStatus } from "@/shared/types";
import { useTripsList } from "../api/trips.queries";
import { AdminTripsFiltersPanel } from "../components/AdminTripsFiltersPanel";
import type { TripsScopeFiltersValue } from "../components/TripsScopeFilters";

const SERVICE_OPTIONS = [
  { value: "all" as const, label: "Tous services" },
  { value: "taxi", label: "Taxi" },
  { value: "delivery", label: "Livraison" },
  { value: "rental", label: "Location" },
  { value: "freight", label: "Fret" },
];

export function TripsListPage() {
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [serviceFilter, setServiceFilter] =
    useState<(typeof SERVICE_OPTIONS)[number]["value"]>("all");
  const [scope, setScope] = useState<TripsScopeFiltersValue>({
    franchiseId: null,
    partnerId: null,
  });
  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });

  useInitialUrlFilter(
    "status",
    STATUS_FILTER_OPTIONS.map((o) => o.value),
    setStatusFilter,
    "all"
  );

  const table = useServerTableState(
    [
      statusFilter,
      serviceFilter,
      scope.franchiseId,
      scope.partnerId,
      dateRange.dateFrom,
      dateRange.dateTo,
    ],
    {
      service: serviceFilter !== "all" ? serviceFilter : undefined,
      franchise_id: scope.franchiseId ?? undefined,
      partner_id: scope.partnerId ?? undefined,
      ...dateRange.listParams,
    }
  );

  const scopeActive = scope.franchiseId != null || scope.partnerId != null;

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: serviceFilter, defaultValue: "all", reset: () => setServiceFilter("all") },
      {
        value: scopeActive,
        defaultValue: false,
        reset: () => setScope({ franchiseId: null, partnerId: null }),
      },
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = useTripsList(statusFilter, table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const filterOptions = data?.filter_options ?? {
    franchises: [],
    partners: [],
  };
  const showScopeColumns = !scopeActive;

  const columns: Column<Trip>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <Link
          href={`/admin/ops/trips/${t.id}`}
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
    ...(showScopeColumns
      ? [
          {
            id: "franchise",
            header: "Franchise",
            cell: (t: Trip) =>
              t.franchise_id != null ? (
                <Link
                  href={`/admin/network/franchises/${t.franchise_id}`}
                  className="text-sm text-foreground hover:text-teal"
                >
                  {t.franchise_name ?? `Franchise ${t.franchise_id}`}
                </Link>
              ) : (
                "—"
              ),
            exportValue: (t: Trip) => t.franchise_name ?? "",
          } satisfies Column<Trip>,
          {
            id: "partner",
            header: "Partenaire",
            cell: (t: Trip) =>
              t.partner_id != null ? (
                <Link
                  href={`/admin/network/partners/${t.partner_id}`}
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
    return <p className="text-sm text-red-600">Impossible de charger les courses.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Courses" breadcrumb={["Admin", "Opérations"]} />

      <AdminTripsFiltersPanel
        filterOptions={filterOptions}
        scope={scope}
        onScopeChange={setScope}
        serviceFilter={serviceFilter}
        onServiceFilterChange={(v) =>
          setServiceFilter(v as (typeof SERVICE_OPTIONS)[number]["value"])
        }
        serviceOptions={SERVICE_OPTIONS}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_FILTER_OPTIONS}
        dateRange={dateRange}
        search={table.search}
        onSearchChange={table.setSearch}
        totalLabel={
          meta ? `${meta.total.toLocaleString("fr-CI")} courses` : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onResetAll={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="courses"
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
