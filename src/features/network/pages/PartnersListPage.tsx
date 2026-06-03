"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { Button } from "@/shared/ui/Button";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Partner } from "@/shared/types";
import { usePartnersList } from "../api/partners.queries";

const ENTITY_STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
} as const;

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Tous les statuts" },
  { value: "active" as const, label: "Actif" },
  { value: "pending" as const, label: "En attente" },
  { value: "suspended" as const, label: "Suspendu" },
];

export function PartnersListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<Partner["status"] | "all">("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = usePartnersList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Partner>[] = [
    {
      id: "name",
      header: "Partenaire",
      cell: (p) => (
        <div>
          <Link
            href={`/admin/network/partners/${p.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {p.name}
          </Link>
          <p className="text-xs text-muted">{p.contact_email}</p>
        </div>
      ),
      exportValue: (p) => `${p.name} (${p.contact_email})`,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (p) => p.franchise_name,
      exportValue: (p) => p.franchise_name,
    },
    {
      id: "city",
      header: "Ville",
      cell: (p) => p.city,
      exportValue: (p) => p.city,
    },
    {
      id: "drivers",
      header: "Chauffeurs",
      className: "tabular-nums",
      cell: (p) => p.drivers_count,
      exportValue: (p) => p.drivers_count,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => <EntityStatusPill status={p.status} />,
      exportValue: (p) => ENTITY_STATUS_LABELS[p.status],
    },
    {
      id: "phone",
      header: "Contact",
      cell: (p) => (
        <span className="whitespace-nowrap text-muted">{p.contact_phone}</span>
      ),
      exportValue: (p) => p.contact_phone,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les partenaires.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Partenaires"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          <Button variant="primary" onClick={() => router.push("/admin/network/partners/new")}>
            Nouveau partenaire
          </Button>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, franchise, email…"
        totalLabel={meta ? `${meta.total} partenaires` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Statut"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="partenaires"
        emptyTitle="Aucun partenaire"
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
