"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { RecurringBooking } from "../api/shifts.service";
import { usePartnerRecurringBookings } from "../api/shifts.queries";

const FREQ_LABELS: Record<RecurringBooking["frequency"], string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

export function PartnerRecurringBookingsPage() {
  const table = useServerTableState();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerRecurringBookings(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<RecurringBooking>[] = [
    {
      id: "client",
      header: "Client",
      cell: (b) => (
        <div>
          <p className="font-medium text-foreground">{b.client_name}</p>
          <p className="text-xs text-muted">{b.id}</p>
        </div>
      ),
      exportValue: (b) => b.client_name,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (b) => (
        <div className="min-w-[180px]">
          <p className="text-sm">{b.from_label}</p>
          <p className="text-xs text-muted">→ {b.to_label}</p>
        </div>
      ),
      exportValue: (b) => `${b.from_label} → ${b.to_label}`,
    },
    {
      id: "freq",
      header: "Récurrence",
      cell: (b) => (
        <span className="text-sm">
          {FREQ_LABELS[b.frequency]}
          {b.weekdays.length > 0 ? ` (${b.weekdays.join(", ")})` : ""} · {b.time}
        </span>
      ),
      exportValue: (b) => FREQ_LABELS[b.frequency],
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums",
      cell: (b) => formatFCFA(b.amount_fcfa),
      exportValue: (b) => b.amount_fcfa,
    },
    {
      id: "next",
      header: "Prochaine",
      cell: (b) =>
        b.next_occurrence_at ? formatDateTime(b.next_occurrence_at) : "—",
      exportValue: (b) => b.next_occurrence_at ?? "",
    },
    {
      id: "status",
      header: "Statut",
      cell: (b) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            b.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-canvas text-muted"
          }`}
        >
          {b.status === "active" ? "Actif" : "En pause"}
        </span>
      ),
      exportValue: (b) => (b.status === "active" ? "Actif" : "En pause"),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les réservations récurrentes.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Réservations récurrentes"
        breadcrumb={["Partenaire", "Activité"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Client, trajet…"
        totalLabel={meta ? `${meta.total} réservations récurrentes` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        exportFileName="reservations-recurrentes"
        emptyTitle="Aucune réservation récurrente"
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
