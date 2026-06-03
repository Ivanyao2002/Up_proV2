"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { BulkActionBar } from "@/shared/ui/BulkActionBar";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { notificationService } from "@/core/http/notificationService";
import { driverBulkStatusMessage } from "@/shared/lib/bulkLabels";
import {
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Driver } from "@/shared/types";
import { useDriversList } from "../api/drivers.queries";

const ZONE_OPTIONS = [
  { value: "all" as const, label: "Toutes les zones" },
  { value: "Cocody", label: "Cocody" },
  { value: "Yopougon", label: "Yopougon" },
  { value: "Plateau", label: "Plateau" },
  { value: "Marcory", label: "Marcory" },
  { value: "Treichville", label: "Treichville" },
  { value: "Adjamé", label: "Adjamé" },
];

const ACCOUNT_OPTIONS = [
  { value: "all" as const, label: "Tous les comptes" },
  { value: "approved", label: "Approuvé" },
  { value: "pending", label: "En attente" },
  { value: "suspended", label: "Suspendu" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all" as const, label: "Toutes dispo." },
  { value: "online", label: "En ligne" },
  { value: "offline", label: "Hors ligne" },
  { value: "on_trip", label: "En course" },
  { value: "paused", label: "Pause" },
];

export function DriversListPage() {
  const [zoneFilter, setZoneFilter] = useState<(typeof ZONE_OPTIONS)[number]["value"]>("all");
  const [accountFilter, setAccountFilter] =
    useState<(typeof ACCOUNT_OPTIONS)[number]["value"]>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<(typeof AVAILABILITY_OPTIONS)[number]["value"]>("all");
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const table = useServerTableState(
    [zoneFilter, accountFilter, availabilityFilter],
    {
      zone: zoneFilter !== "all" ? zoneFilter : undefined,
      account_status: accountFilter !== "all" ? accountFilter : undefined,
      availability: availabilityFilter !== "all" ? availabilityFilter : undefined,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: zoneFilter, defaultValue: "all", reset: () => setZoneFilter("all") },
      { value: accountFilter, defaultValue: "all", reset: () => setAccountFilter("all") },
      {
        value: availabilityFilter,
        defaultValue: "all",
        reset: () => setAvailabilityFilter("all"),
      },
    ],
  });

  const { data, isLoading, isError } = useDriversList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/admin/fleet/drivers/${d.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {d.first_name} {d.last_name}
          </Link>
          <p className="text-xs text-muted">{d.phone}</p>
        </div>
      ),
      exportValue: (d) => `${d.first_name} ${d.last_name} (${d.phone})`,
    },
    {
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone,
      exportValue: (d) => d.zone,
    },
    {
      id: "owner",
      header: "Partenaire",
      cell: (d) => d.owner_name ?? "—",
      exportValue: (d) => d.owner_name ?? "",
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (d) => (
        <span className="text-muted">{d.vehicle_label ?? "—"}</span>
      ),
      exportValue: (d) => d.vehicle_label ?? "",
    },
    {
      id: "rating",
      header: "Note",
      className: "tabular-nums",
      cell: (d) => (d.rating > 0 ? d.rating.toFixed(2) : "—"),
      exportValue: (d) => (d.rating > 0 ? d.rating : ""),
    },
    {
      id: "account",
      header: "Compte",
      cell: (d) => <AccountStatusPill status={d.account_status} />,
      exportValue: (d) => getDriverAccountStatusLabel(d.account_status),
    },
    {
      id: "availability",
      header: "Disponibilité",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les chauffeurs.</p>
    );
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Chauffeurs" breadcrumb={["Admin", "Flotte"]} />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, zone, partenaire…"
        totalLabel={
          meta ? `${meta.total.toLocaleString("fr-CI")} chauffeurs au total` : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <div className="flex flex-wrap gap-3">
          <SelectFilter
            label="Zone"
            value={zoneFilter}
            onChange={setZoneFilter}
            options={ZONE_OPTIONS}
          />
          <SelectFilter
            label="Compte"
            value={accountFilter}
            onChange={setAccountFilter}
            options={ACCOUNT_OPTIONS}
          />
          <SelectFilter
            label="Disponibilité"
            value={availabilityFilter}
            onChange={setAvailabilityFilter}
            options={AVAILABILITY_OPTIONS}
          />
        </div>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="chauffeurs"
        emptyTitle="Aucun chauffeur"
        emptyDescription="Modifiez vos filtres ou élargissez la recherche."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={[
          {
            label: "Mettre en ligne",
            onClick: () => {
              notificationService.success(
                driverBulkStatusMessage(selected.size, "online")
              );
              setSelected(new Set());
            },
          },
          {
            label: "Hors ligne",
            variant: "secondary",
            onClick: () => {
              notificationService.warning(
                driverBulkStatusMessage(selected.size, "offline")
              );
              setSelected(new Set());
            },
          },
        ]}
      />
    </div>
  );
}
