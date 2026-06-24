"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { FilterChips } from "@/shared/ui/FilterChips";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { AdminSupportTicket } from "../api/tickets.service";
import { useSupportTicketsList } from "../api/tickets.queries";
import { useSupportPaths } from "../lib/supportPaths";
import { TicketStatusBadge } from "../components/TicketStatusBadge";
import type { AgentReporterType, AgentTicketCategory } from "../api/agentTicket.types";
import {
  STATUS_FILTERS,
  STATUS_LABELS,
  REPORTER_FILTERS,
  REPORTER_LABELS,
  REPORTER_STYLES,
  CATEGORY_CONFIG,
  CATEGORY_FILTERS,
  PRIORITY_LABELS,
} from "../lib/ticketConstants";
import { TicketAssignmentCell } from "../components/TicketAssignmentCell";


export function SupportTicketsListPage() {
  const paths = useSupportPaths();

  const [statusFilter,   setStatusFilter]   = useState<AdminSupportTicket["status"] | "all">("all");
  const [reporterFilter, setReporterFilter] = useState<AgentReporterType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AgentTicketCategory | "all">("all");

  const table = useServerTableState([statusFilter, reporterFilter, categoryFilter], {
    status:        statusFilter !== "all" ? statusFilter : undefined,
    reporter_type: reporterFilter !== "all" ? reporterFilter : undefined,
    category:      categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter,   defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: reporterFilter, defaultValue: "all", reset: () => setReporterFilter("all") },
      { value: categoryFilter, defaultValue: "all", reset: () => setCategoryFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useSupportTicketsList(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const facets = data?.facets?.status;

  // Onglets statut avec compteurs (les clés de facets correspondent aux valeurs de filtre).
  const statusOptions = STATUS_FILTERS.map((f) => ({
    value: f.value,
    label: facets ? `${f.label} (${facets[f.value] ?? 0})` : f.label,
  }));

  const columns: Column<AdminSupportTicket>[] = [
    {
      id: "id",
      header: "Ticket",
      cell: (t) => (
        <Link href={paths.ticketDetail(t.id)} className="group block">
          <p className="font-mono text-sm font-medium text-foreground group-hover:text-teal-dark">
            {t.id}
          </p>
          {t.trip_ref && (
            <p className="text-xs text-muted">{t.trip_ref}</p>
          )}
        </Link>
      ),
      exportValue: (t) => t.id,
    },
    {
      id: "subject",
      header: "Sujet",
      cell: (t) => (
        <Link href={paths.ticketDetail(t.id)} className="group block max-w-xs">
          <p className="font-medium text-foreground group-hover:text-teal-dark line-clamp-2">{t.subject}</p>
        </Link>
      ),
      exportValue: (t) => t.subject,
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (t) => {
        const cfg = t.category ? CATEGORY_CONFIG[t.category as AgentTicketCategory] : undefined;
        return cfg ? (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
            {cfg.label}
          </span>
        ) : (
          <span className="text-xs text-muted">{t.category ?? "—"}</span>
        );
      },
      exportValue: (t) => {
        const cfg = t.category ? CATEGORY_CONFIG[t.category as AgentTicketCategory] : undefined;
        return cfg ? cfg.label : (t.category ?? "");
      },
    },
    {
      id: "reporter_type",
      header: "Plaignant",
      cell: (t) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{t.reporter_name}</p>
          <span className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${REPORTER_STYLES[t.reporter_type]}`}>
            {REPORTER_LABELS[t.reporter_type]}
          </span>
        </div>
      ),
      exportValue: (t) => `${t.reporter_name} (${REPORTER_LABELS[t.reporter_type]})`,
    },
    {
      id: "priority",
      header: "Priorité",
      cell: (t) => (
        <span className={`text-xs font-medium ${
          t.priority === "high"   ? "text-red-600 dark:text-red-400" :
          t.priority === "normal" ? "text-foreground" : "text-muted"
        }`}>
          {PRIORITY_LABELS[t.priority]}
        </span>
      ),
      exportValue: (t) => PRIORITY_LABELS[t.priority],
    },
    {
      id: "assignment",
      header: "Prise en charge",
      cell: (t) => <TicketAssignmentCell ticket={t} />,
      exportValue: (t) => t.assigned_to ?? "Non assigné",
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <TicketStatusBadge status={t.status} />,
      exportValue: (t) => STATUS_LABELS[t.status],
    },
    {
      id: "updated",
      header: "Mis à jour",
      cell: (t) => (
        <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(t.updated_at)}</span>
      ),
      exportValue: (t) => t.updated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les réclamations.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Réclamations" breadcrumb={["Support"]} />
      <p className="-mt-2 mb-4 text-sm text-muted">
        Plaintes des clients, chauffeurs et livreurs — prenez en charge un ticket pour ouvrir la conversation.
      </p>

      {/* Onglets statut avec compteurs */}
      <div className="mb-4">
        <FilterChips
          size="sm"
          options={statusOptions}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            table.setPage(1);
          }}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher par sujet, déclarant, référence…"
        totalLabel={meta ? `${meta.total} réclamation${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Catégorie"
          options={CATEGORY_FILTERS}
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            table.setPage(1);
          }}
          wide
        />
        <SelectFilter
          label="Type de plaignant"
          options={REPORTER_FILTERS}
          value={reporterFilter}
          onChange={(value) => {
            setReporterFilter(value);
            table.setPage(1);
          }}
          wide
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="reclamations-support"
        emptyTitle="Aucune réclamation"
        emptyDescription="Aucune réclamation ne correspond aux filtres sélectionnés."
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
