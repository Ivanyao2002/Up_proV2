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
import type { SosIncident, SosIncidentStatus, SosSeverity } from "../api/sos.types";
import { useSosIncidentsList } from "../api/sos.queries";
import {
  SOS_ACTOR_LABELS,
  SOS_SEVERITY_LABELS,
  SOS_STATUS_LABELS,
  SOS_TRIGGER_LABELS,
} from "../lib/sosLabels";
import { SosSeverityBadge } from "../components/SosSeverityBadge";
import { SosStatusPill } from "../components/SosStatusPill";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "active" as const, label: "Actifs" },
  { value: "escalated" as const, label: "Escaladés" },
  { value: "acknowledged" as const, label: "Pris en charge" },
  { value: "resolved" as const, label: "Résolus" },
  { value: "cancelled" as const, label: "Annulés" },
];

const SEVERITY_FILTERS = [
  { value: "all" as const, label: "Toutes sévérités" },
  { value: "critical" as const, label: "Critique" },
  { value: "high" as const, label: "Élevé" },
  { value: "medium" as const, label: "Moyen" },
  { value: "low" as const, label: "Faible" },
];

export function SosIncidentsListPage() {
  const [statusFilter, setStatusFilter] = useState<SosIncidentStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<SosSeverity | "all">("all");

  const table = useServerTableState([statusFilter, severityFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      {
        value: severityFilter,
        defaultValue: "all",
        reset: () => setSeverityFilter("all"),
      },
    ],
  });

  const { data, isLoading, isError } = useSosIncidentsList(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<SosIncident>[] = [
    {
      id: "id",
      header: "Incident",
      cell: (row) => (
        <div>
          <p className="font-mono text-sm font-medium text-foreground">
            {row.id.slice(0, 8)}…
          </p>
          <p className="text-xs text-muted">
            {SOS_ACTOR_LABELS[row.actor_type] ?? row.actor_type}
          </p>
        </div>
      ),
      exportValue: (row) => row.id,
    },
    {
      id: "trigger",
      header: "Déclencheur",
      cell: (row) => SOS_TRIGGER_LABELS[row.trigger] ?? row.trigger,
      exportValue: (row) => row.trigger,
    },
    {
      id: "severity",
      header: "Sévérité",
      cell: (row) => <SosSeverityBadge severity={row.severity} />,
      exportValue: (row) => SOS_SEVERITY_LABELS[row.severity],
    },
    {
      id: "risk",
      header: "Risque",
      cell: (row) => (
        <span className="font-mono text-sm font-semibold tabular-nums">
          {row.risk_score}
        </span>
      ),
      exportValue: (row) => String(row.risk_score),
    },
    {
      id: "status",
      header: "Statut",
      cell: (row) => <SosStatusPill status={row.status} />,
      exportValue: (row) => SOS_STATUS_LABELS[row.status],
    },
    {
      id: "triggered",
      header: "Déclenché",
      cell: (row) => formatDateTime(row.triggered_at),
      exportValue: (row) => row.triggered_at,
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <Link
          href={`/admin/ops/sos/incidents/${row.id}`}
          className="text-sm font-medium text-teal hover:underline"
        >
          Détail
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les incidents SOS.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Historique SOS"
        breadcrumb={["Admin", "Opérations", "SOS", "Incidents"]}
        actions={
          <Link
            href="/admin/ops/sos"
            className="text-sm font-medium text-teal hover:underline"
          >
            ← Centre live
          </Link>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher un incident…"
        totalLabel={meta ? `${meta.total} incidents` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterChips
          options={SEVERITY_FILTERS}
          value={severityFilter}
          onChange={setSeverityFilter}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        exportFileName="incidents-sos"
        emptyTitle="Aucun incident SOS"
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
