"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { FleetClient } from "../api/clients.service";
import { useClientsList } from "../api/clients.queries";
import {
  getFleetClientsPaths,
  type FleetClientsPortal,
} from "../lib/fleetClientsPaths";
import { useFranchiseClientsList } from "@/features/franchise/api/clients.queries";

const TYPE_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "b2c" as const, label: "B2C" },
  { value: "b2b" as const, label: "B2B" },
];

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Tous les statuts" },
  { value: "active" as const, label: "Actif" },
  { value: "suspended" as const, label: "Suspendu" },
];

export function ClientsListPage({ portal = "admin" }: { portal?: FleetClientsPortal }) {
  const paths = getFleetClientsPaths(portal);
  const [typeFilter, setTypeFilter] = useState<FleetClient["type"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FleetClient["status"] | "all">("all");

  const table = useServerTableState([typeFilter, statusFilter], {
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: typeFilter, defaultValue: "all", reset: () => setTypeFilter("all") },
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const adminList = useClientsList(table.listParams);
  const franchiseList = useFranchiseClientsList(table.listParams);
  const { data, isLoading, isError } =
    portal === "franchise" ? franchiseList : adminList;

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FleetClient>[] = [
    {
      id: "name",
      header: "Client",
      cell: (c) => (
        <div>
          <Link
            href={paths.detail(c.id)}
            className="font-medium text-foreground hover:text-teal"
          >
            {c.first_name || c.last_name
              ? `${c.first_name} ${c.last_name}`.trim()
              : c.full_name}
          </Link>
          <p className="text-xs text-muted">{c.phone}</p>
          {c.email && <p className="text-xs text-muted">{c.email}</p>}
        </div>
      ),
      exportValue: (c) => c.full_name,
    },
    {
      id: "type",
      header: "Type",
      cell: (c) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
          c.user_type === "DRIVER"
            ? "bg-navy/10 text-navy"
            : c.type === "b2b"
            ? "bg-amber-100 text-amber-700"
            : "bg-teal/10 text-teal-dark"
        }`}>
          {c.user_type === "DRIVER" ? "Chauffeur" : c.type.toUpperCase()}
        </span>
      ),
      exportValue: (c) => c.user_type,
    },
    {
      id: "trips",
      header: "Courses",
      className: "tabular-nums",
      cell: (c) => c.trips_count,
      exportValue: (c) => c.trips_count,
    },
    {
      id: "wallet",
      header: "Wallet",
      className: "tabular-nums",
      cell: (c) => formatFCFA(c.wallet_balance_fcfa),
      exportValue: (c) => c.wallet_balance_fcfa,
    },
    {
      id: "registered",
      header: "Inscription",
      className: "text-muted whitespace-nowrap",
      cell: (c) => formatDateTime(c.registered_at),
      exportValue: (c) => c.registered_at,
    },
    {
      id: "last",
      header: "Dernière course",
      className: "text-muted whitespace-nowrap",
      cell: (c) => (c.last_trip_at ? formatDateTime(c.last_trip_at) : "—"),
      exportValue: (c) => c.last_trip_at ?? "",
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-red-50 text-red-700"
          }`}
        >
          {c.status === "active" ? "Actif" : "Suspendu"}
        </span>
      ),
      exportValue: (c) => c.status,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les clients.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Clients" breadcrumb={[...paths.breadcrumbList]} />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher un client…"
        totalLabel={meta ? `${meta.total} clients` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <div className="flex flex-wrap items-end gap-3">
          <FilterChips
            options={TYPE_FILTERS}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <SelectFilter
            label="Statut"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
        </div>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="clients"
        emptyTitle="Aucun client"
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
