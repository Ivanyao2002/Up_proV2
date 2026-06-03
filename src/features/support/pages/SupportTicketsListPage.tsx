"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { AdminSupportTicket } from "../api/tickets.service";
import { useSupportTicketsList } from "../api/tickets.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "open" as const, label: "Ouverts" },
  { value: "in_progress" as const, label: "En cours" },
  { value: "resolved" as const, label: "Résolus" },
];

const STATUS_LABELS: Record<AdminSupportTicket["status"], string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const PRIORITY_LABELS: Record<AdminSupportTicket["priority"], string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};

export function SupportTicketsListPage() {
  const [statusFilter, setStatusFilter] = useState<
    AdminSupportTicket["status"] | "all"
  >("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useSupportTicketsList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<AdminSupportTicket>[] = [
    {
      id: "id",
      header: "Ticket",
      cell: (t) => (
        <div>
          <p className="font-mono font-medium text-foreground">{t.id}</p>
          <p className="text-xs text-muted">{t.category}</p>
        </div>
      ),
      exportValue: (t) => t.id,
    },
    {
      id: "subject",
      header: "Sujet",
      cell: (t) => (
        <div>
          <p className="font-medium text-foreground">{t.subject}</p>
          <p className="text-xs text-muted">{t.reporter_name}</p>
        </div>
      ),
      exportValue: (t) => t.subject,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (t) => t.franchise_name,
      exportValue: (t) => t.franchise_name,
    },
    {
      id: "priority",
      header: "Priorité",
      cell: (t) => (
        <span
          className={`text-xs font-medium ${
            t.priority === "high"
              ? "text-red-600"
              : t.priority === "normal"
                ? "text-foreground"
                : "text-muted"
          }`}
        >
          {PRIORITY_LABELS[t.priority]}
        </span>
      ),
      exportValue: (t) => PRIORITY_LABELS[t.priority],
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            t.status === "resolved"
              ? "bg-teal/15 text-teal-dark"
              : t.status === "in_progress"
                ? "bg-amber-50 text-amber-700"
                : "bg-navy/10 text-foreground"
          }`}
        >
          {STATUS_LABELS[t.status]}
        </span>
      ),
      exportValue: (t) => STATUS_LABELS[t.status],
    },
    {
      id: "actions",
      header: "",
      cell: (t) =>
        t.category === "dispute" && t.dispute_id ? (
          <Link
            href={`/admin/support/disputes/${t.dispute_id}`}
            className="text-sm text-teal hover:underline"
          >
            Voir litige
          </Link>
        ) : null,
      exportValue: () => "",
    },
    {
      id: "updated",
      header: "Mis à jour",
      cell: (t) => formatDateTime(t.updated_at),
      exportValue: (t) => t.updated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les tickets.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Tickets support" breadcrumb={["Admin", "Support"]} />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher un ticket…"
        totalLabel={meta ? `${meta.total} tickets` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="tickets-support"
        emptyTitle="Aucun ticket"
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
