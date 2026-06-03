"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { Button } from "@/shared/ui/Button";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { AdminRole } from "@/shared/types";
import { useRolesList } from "../api/roles.queries";

export function RolesListPage() {
  const table = useServerTableState();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = useRolesList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<AdminRole>[] = [
    {
      id: "name",
      header: "Rôle",
      cell: (r) => (
        <div>
          <Link
            href={`/admin/settings/roles/${r.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {r.name}
          </Link>
          <p className="text-xs text-muted">{r.slug}</p>
        </div>
      ),
      exportValue: (r) => r.name,
    },
    {
      id: "description",
      header: "Description",
      cell: (r) => <span className="text-sm text-muted">{r.description}</span>,
      exportValue: (r) => r.description,
    },
    {
      id: "users",
      header: "Utilisateurs",
      className: "tabular-nums",
      cell: (r) => r.users_count,
      exportValue: (r) => r.users_count,
    },
    {
      id: "type",
      header: "Type",
      cell: (r) => (
        <span className="text-xs text-muted">
          {r.is_system ? "Système" : "Personnalisé"}
        </span>
      ),
      exportValue: (r) => (r.is_system ? "Système" : "Personnalisé"),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Link
          href={`/admin/settings/roles/${r.id}`}
          className="text-sm text-teal hover:underline"
        >
          Permissions
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les rôles.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Rôles & permissions"
        breadcrumb={["Admin", "Paramètres"]}
        actions={
          <Link href="/admin/settings/roles/new">
            <Button variant="primary">Nouveau rôle</Button>
          </Link>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, slug, description…"
        totalLabel={meta ? `${meta.total} rôles` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="roles"
        emptyTitle="Aucun rôle"
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
