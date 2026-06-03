"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { StatusPill } from "@/shared/ui/StatusPill";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel, STATUS_FILTER_OPTIONS } from "@/shared/lib/tripLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { TripStatus } from "@/shared/types";
import type { PartnerBooking } from "../api/bookings.service";
import { usePartnerBookingsList } from "../api/bookings.queries";

const SERVICE_OPTIONS = [
  { value: "all" as const, label: "Tous services" },
  { value: "taxi" as const, label: "Taxi" },
  { value: "delivery" as const, label: "Livraison" },
  { value: "rental" as const, label: "Location" },
  { value: "freight" as const, label: "Fret" },
];

export function PartnerBookingsListPage() {
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [serviceFilter, setServiceFilter] =
    useState<(typeof SERVICE_OPTIONS)[number]["value"]>("all");

  const table = useServerTableState([statusFilter, serviceFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
    service: serviceFilter !== "all" ? serviceFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: serviceFilter, defaultValue: "all", reset: () => setServiceFilter("all") },
    ],
  });

  const { data, isLoading, isError } = usePartnerBookingsList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<PartnerBooking>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (b) => (
        <Link
          href={`/partner/bookings/${b.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {b.ref}
        </Link>
      ),
      exportValue: (b) => b.ref,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (b) => (
        <div className="min-w-[200px]">
          <p className="text-sm text-foreground">{b.from_label}</p>
          <p className="text-xs text-muted">→ {b.to_label}</p>
        </div>
      ),
      exportValue: (b) => `${b.from_label} → ${b.to_label}`,
    },
    {
      id: "client",
      header: "Client",
      cell: (b) => (
        <div>
          <p className="text-sm">{b.client_name}</p>
          {b.client_phone && <p className="text-xs text-muted">{b.client_phone}</p>}
        </div>
      ),
      exportValue: (b) => b.client_phone ? `${b.client_name} (${b.client_phone})` : b.client_name,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (b) => b.driver_name ?? "—",
      exportValue: (b) => b.driver_name ?? "",
    },
    {
      id: "amount",
      header: "Montant",
      cell: (b) => formatFCFA(b.amount_fcfa),
      exportValue: (b) => b.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (b) => <StatusPill status={b.status} pulse={b.status === "in_progress"} />,
      exportValue: (b) => getTripStatusLabel(b.status),
    },
    {
      id: "date",
      header: "Créée le",
      cell: (b) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDateTime(b.created_at)}
        </span>
      ),
      exportValue: (b) => formatDateTime(b.created_at),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les réservations.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Réservations"
        breadcrumb={["Partenaire", "Courses"]}
        actions={
          <Link href="/partner/bookings/new">
            <Button>Nouvelle réservation</Button>
          </Link>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., client, adresse, chauffeur…"
        totalLabel={meta ? `${meta.total} réservations enregistrées` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        exportFileName="reservations-partenaire"
        emptyTitle="Aucune réservation"
        emptyDescription="Créez une course manuelle pour votre flotte."
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
