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
import type {
  FranchiseSupportTicket,
  SupportReporterType,
} from "../api/support.service";
import { useFranchiseSupportTickets } from "../api/support.queries";

const PRIORITY_LABELS: Record<FranchiseSupportTicket["priority"], string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};

const STATUS_LABELS: Record<FranchiseSupportTicket["status"], string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const REPORTER_LABELS: Record<SupportReporterType, string> = {
  partner: "Partenaire",
  driver: "Chauffeur",
  client: "Client",
};

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "open" as const, label: "Ouverts" },
  { value: "in_progress" as const, label: "En cours" },
  { value: "resolved" as const, label: "Résolus" },
];

const TYPE_FILTERS = [
  { value: "all" as const, label: "Tous profils" },
  { value: "partner" as const, label: "Partenaires" },
  { value: "driver" as const, label: "Chauffeurs" },
  { value: "client" as const, label: "Clients" },
];

export function FranchiseSupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState<
    FranchiseSupportTicket["status"] | "all"
  >("all");
  const [typeFilter, setTypeFilter] = useState<SupportReporterType | "all">("all");

  const table = useServerTableState([statusFilter, typeFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: typeFilter, defaultValue: "all", reset: () => setTypeFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchiseSupportTickets(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FranchiseSupportTicket>[] = [
    {
      id: "id",
      header: "Ticket",
      cell: (t) => (
        <Link
          href={`/franchise/support/tickets/${t.id}`}
          className="font-mono font-medium text-teal hover:underline"
        >
          {t.id}
        </Link>
      ),
      exportValue: (t) => t.id,
    },
    {
      id: "subject",
      header: "Sujet",
      cell: (t) => (
        <div>
          <p className="text-sm font-medium text-foreground">{t.subject}</p>
          <p className="text-xs text-muted">{t.category}</p>
        </div>
      ),
      exportValue: (t) => t.subject,
    },
    {
      id: "reporter",
      header: "Émetteur",
      cell: (t) => (
        <div>
          <p className="text-sm text-foreground">{t.reporter_name}</p>
          <p className="text-xs text-muted">{REPORTER_LABELS[t.reporter_type]}</p>
        </div>
      ),
      exportValue: (t) => t.reporter_name,
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
      id: "updated",
      header: "Mis à jour",
      cell: (t) => formatDateTime(t.updated_at),
      exportValue: (t) => t.updated_at,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les tickets.{" "}
        <Link href="/franchise/support" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader title="Tickets" breadcrumb={["Franchise", "Support", "Tickets"]} />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} ticket{meta.total > 1 ? "s" : ""} · {rows.filter((t) => t.status !== "resolved").length} ouvert{rows.filter((t) => t.status !== "resolved").length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Ticket, sujet, émetteur…"
        totalLabel={meta ? `${meta.total} tickets` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
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
        exportFileName="tickets-franchise"
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
