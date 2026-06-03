"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
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
import { useFranchiseDriversList } from "../api/drivers.queries";

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

interface FranchiseDriversListPageProps {
  pendingOnly?: boolean;
}

export function FranchiseDriversListPage({ pendingOnly }: FranchiseDriversListPageProps) {
  const [zoneFilter, setZoneFilter] = useState<(typeof ZONE_OPTIONS)[number]["value"]>("all");
  const [accountFilter, setAccountFilter] =
    useState<(typeof ACCOUNT_OPTIONS)[number]["value"]>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<(typeof AVAILABILITY_OPTIONS)[number]["value"]>("all");

  const table = useServerTableState(
    [zoneFilter, accountFilter, availabilityFilter, pendingOnly],
    {
      zone: zoneFilter !== "all" ? zoneFilter : undefined,
      account_status: pendingOnly
        ? "pending"
        : accountFilter !== "all"
          ? accountFilter
          : undefined,
      availability: availabilityFilter !== "all" ? availabilityFilter : undefined,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: zoneFilter, defaultValue: "all", reset: () => setZoneFilter("all") },
      ...(!pendingOnly
        ? [
            {
              value: accountFilter,
              defaultValue: "all" as const,
              reset: () => setAccountFilter("all"),
            },
          ]
        : []),
      {
        value: availabilityFilter,
        defaultValue: "all",
        reset: () => setAvailabilityFilter("all"),
      },
    ],
  });

  const { data, isLoading, isError } = useFranchiseDriversList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/franchise/drivers/${d.id}`}
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
      id: "owner",
      header: "Partenaire",
      cell: (d) => d.owner_name ?? "—",
      exportValue: (d) => d.owner_name ?? "",
    },
    {
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone,
      exportValue: (d) => d.zone,
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
    return <p className="text-sm text-red-600">Impossible de charger les chauffeurs.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={pendingOnly ? "Modération KYC" : "Chauffeurs du territoire"}
        breadcrumb={["Franchise", "Flotte"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, partenaire…"
        totalLabel={
          meta
            ? `${meta.total} chauffeur${meta.total > 1 ? "s" : ""} sur le territoire`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        {!pendingOnly && (
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
        )}
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName={
          pendingOnly ? "moderation-kyc-franchise" : "chauffeurs-franchise"
        }
        emptyTitle={pendingOnly ? "Aucun dossier en attente" : "Aucun chauffeur"}
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
