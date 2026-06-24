"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { useSupportAuditLog } from "../api/supportAudit.queries";
import { useSupportPaths } from "../lib/supportPaths";
import type {
  SupportAuditAction,
  SupportAuditCategory,
  SupportAuditEvent,
  SupportAuditSeverity,
} from "../api/supportAudit.types";
import {
  ACTION_LABELS,
  SEVERITY_FILTERS,
  CATEGORY_FILTERS,
  ACTION_FILTERS,
  DATE_PRESETS,
  getDateFrom,
  getActionSubtype,
} from "../lib/auditConstants";
import type { DatePreset } from "../lib/auditConstants";
import { AuditDetailModal, SeverityBadge } from "../components/AuditDetailModal";


export function SupportAuditPage() {
  const paths = useSupportPaths();
  const [severityFilter, setSeverityFilter] = useState<SupportAuditSeverity | "all">("all");
  const [actionFilter,   setActionFilter]   = useState<SupportAuditAction | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<SupportAuditCategory | "all">("all");
  const [datePreset,     setDatePreset]     = useState<DatePreset>("all");
  const [selectedEvent,  setSelectedEvent]  = useState<SupportAuditEvent | null>(null);

  const table = useServerTableState(
    [severityFilter, actionFilter, categoryFilter, datePreset],
    {
      date_from: getDateFrom(datePreset),
      date_to:   datePreset !== "all" ? new Date().toISOString().split("T")[0] : undefined,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: severityFilter,  defaultValue: "all", reset: () => setSeverityFilter("all") },
      { value: actionFilter,    defaultValue: "all", reset: () => setActionFilter("all") },
      { value: categoryFilter,  defaultValue: "all", reset: () => setCategoryFilter("all") },
      { value: datePreset,      defaultValue: "all", reset: () => setDatePreset("all") },
    ],
  });

  const { data, isLoading, isError } = useSupportAuditLog({
    ...table.listParams,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    action:   actionFilter   !== "all" ? actionFilter   : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });
  const rows: SupportAuditEvent[] = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<SupportAuditEvent>[] = [
    {
      id: "at",
      header: "Date",
      cell: (e) => (
        <span className="whitespace-nowrap text-sm text-muted">{formatDateTime(e.at)}</span>
      ),
      exportValue: (e) => e.at,
    },
    {
      id: "actor",
      header: "Acteur",
      cell: (e) => (
        <div>
          <p className="text-sm font-medium text-foreground">{e.actor_name}</p>
          <p className="text-xs text-muted">{e.actor_email}</p>
        </div>
      ),
      exportValue: (e) => e.actor_email,
    },
    {
      id: "severity",
      header: "Niveau",
      cell: (e) => <SeverityBadge severity={e.severity} />,
      exportValue: (e) => e.severity,
    },
    {
      id: "action",
      header: "Action réalisée",
      cell: (e) => {
        const subtype = getActionSubtype(e);
        return (
          <div>
            <p className="text-sm font-medium text-foreground">
              {ACTION_LABELS[e.action]}
            </p>
            {subtype && <p className="text-xs text-muted">{subtype}</p>}
          </div>
        );
      },
      exportValue: (e) => ACTION_LABELS[e.action],
    },
    {
      id: "resource",
      header: "Ressource",
      cell: (e) =>
        e.resource_id ? (
          <Link
            href={paths.ticketDetail(e.resource_id)}
            className="text-xs text-teal hover:underline"
            onClick={(ev) => ev.stopPropagation()}
          >
            {e.resource_label ?? e.resource_id}
          </Link>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
      exportValue: (e) => e.resource_label ?? e.resource_id ?? "",
    },
    {
      id: "detail",
      header: "Détail",
      cell: (e) => (
        <span className="max-w-xs text-xs text-muted">{e.detail}</span>
      ),
      exportValue: (e) => e.detail,
    },
    {
      id: "actions",
      header: "",
      cell: (e) => (
        <button
          type="button"
          onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          title="Voir les détails"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ),
      exportValue: () => "",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Historique des réclamations"
        breadcrumb={["Support", "Réclamations", "Historique"]}
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Chaque action réalisée sur une réclamation est enregistrée automatiquement avec son agent et son horodatage.
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher un ticket, un agent ou une action…"
        totalLabel={meta ? `${meta.total} action${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Période"
          value={datePreset}
          onChange={(value) => {
            setDatePreset(value);
            table.setPage(1);
          }}
          options={[...DATE_PRESETS]}
        />

        <SelectFilter
          label="Niveau"
          value={severityFilter}
          onChange={(value) => {
            setSeverityFilter(value);
            table.setPage(1);
          }}
          options={SEVERITY_FILTERS}
        />

        <SelectFilter
          label="Catégorie"
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            table.setPage(1);
          }}
          options={CATEGORY_FILTERS}
          wide
        />

        <SelectFilter
          label="Action"
          value={actionFilter}
          onChange={(value) => {
            setActionFilter(value);
            table.setPage(1);
          }}
          options={ACTION_FILTERS}
          wide
        />
      </TableFiltersBar>

      <DataTable<SupportAuditEvent>
        columns={columns}
        data={rows}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        exportFileName="journal-audit-support"
        emptyTitle="Aucune action enregistrée"
        emptyDescription={isError ? "L'historique des réclamations n'est pas disponible." : "Aucune action ne correspond aux filtres sélectionnés."}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />

      {selectedEvent && (
        <AuditDetailModal
          event={selectedEvent}
          paths={paths}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
