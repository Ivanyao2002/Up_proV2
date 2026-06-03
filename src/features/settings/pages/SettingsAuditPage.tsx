"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { AuditLogEntry } from "../api/settingsExtended.service";
import { useAuditLog } from "../api/settingsExtended.queries";

export function SettingsAuditPage() {
  const table = useServerTableState();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = useAuditLog(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<AuditLogEntry>[] = [
    {
      id: "at",
      header: "Date",
      cell: (e) => formatDateTime(e.at),
      exportValue: (e) => e.at,
    },
    {
      id: "actor",
      header: "Acteur",
      cell: (e) => <span className="text-sm">{e.actor_email}</span>,
      exportValue: (e) => e.actor_email,
    },
    {
      id: "action",
      header: "Action",
      cell: (e) => <span className="font-mono text-xs text-muted">{e.action}</span>,
      exportValue: (e) => e.action,
    },
    {
      id: "resource",
      header: "Ressource",
      cell: (e) => <span className="font-medium text-foreground">{e.resource}</span>,
      exportValue: (e) => e.resource,
    },
    {
      id: "detail",
      header: "Détail",
      cell: (e) => <span className="text-sm text-muted">{e.detail}</span>,
      exportValue: (e) => e.detail,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger le journal d&apos;audit.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Journal d'audit" breadcrumb={["Admin", "Paramètres"]} />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Filtrer par acteur, action, ressource…"
        totalLabel={meta ? `${meta.total} entrées` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        exportFileName="audit-log"
        emptyTitle="Aucune entrée"
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
