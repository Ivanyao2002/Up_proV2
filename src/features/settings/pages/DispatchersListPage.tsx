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
import { usePermission } from "@/core/auth/usePermission";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { DispatcherAccount, DispatcherStatus } from "@/shared/types";
import { useDispatchersList } from "../api/dispatchers.queries";
import { lastLoginLabel } from "../lib/lastLoginLabel";
import { useZonesList } from "@/features/network/api/zones.queries";

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Tous les statuts" },
  { value: "active" as const, label: "Actif" },
  { value: "suspended" as const, label: "Suspendu" },
];

const STATUS_LABELS: Record<DispatcherStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
};

export function DispatchersListPage() {
  const router = useRouter();
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const canCreate = usePermission("settings.dispatchers.create");

  const { data: zonesData } = useZonesList({ per_page: 100 });

  const table = useServerTableState([zoneFilter, statusFilter], {
    zone_id: zoneFilter !== "all" ? Number(zoneFilter) : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: zoneFilter, defaultValue: "all", reset: () => setZoneFilter("all") },
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useDispatchersList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const zoneOptions = [
    { value: "all" as const, label: "Toutes les zones" },
    ...(zonesData?.data ?? []).map((z) => ({
      value: String(z.id),
      label: z.name,
    })),
  ];

  const columns: Column<DispatcherAccount>[] = [
    {
      id: "name",
      header: "Nom",
      cell: (d) => (
        <Link
          href={`/admin/settings/dispatchers/${d.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {d.name}
        </Link>
      ),
      exportValue: (d) => d.name,
    },
    {
      id: "email",
      header: "Email",
      cell: (d) => d.email,
      exportValue: (d) => d.email,
    },
    {
      id: "phone",
      header: "Téléphone",
      cell: (d) => <span className="whitespace-nowrap text-muted">{d.phone}</span>,
      exportValue: (d) => d.phone,
    },
    {
      id: "zones",
      header: "Zones",
      cell: (d) => (
        <span className="text-sm text-muted">
          {(d.zone_names ?? []).join(", ") || "—"}
        </span>
      ),
      exportValue: (d) => (d.zone_names ?? []).join(", "),
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (d) => d.franchise_name ?? "Plateforme",
      exportValue: (d) => d.franchise_name ?? "Plateforme",
    },
    {
      id: "status",
      header: "Statut",
      cell: (d) => <EntityStatusPill status={d.status} />,
      exportValue: (d) => STATUS_LABELS[d.status],
    },
    {
      id: "last_login",
      header: "Connexion",
      cell: (d) => (
        <span className="text-sm text-muted tabular-nums">
          {lastLoginLabel(d.last_login_at)}
        </span>
      ),
      exportValue: (d) => lastLoginLabel(d.last_login_at),
    },
    {
      id: "actions",
      header: "",
      cell: (d) => (
        <Link
          href={`/admin/settings/dispatchers/${d.id}`}
          className="text-sm text-teal hover:underline"
        >
          Voir
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les dispatchers.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dispatchers"
        breadcrumb={["Admin", "Paramètres"]}
        actions={
          canCreate ? (
            <Button onClick={() => router.push("/admin/settings/dispatchers/new")}>
              + Nouveau
            </Button>
          ) : undefined
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, email, zone…"
        totalLabel={
          meta ? `${meta.total.toLocaleString("fr-CI")} comptes dispatch` : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <div className="flex flex-wrap gap-3">
          <SelectFilter
            label="Zone"
            value={zoneFilter}
            onChange={setZoneFilter}
            options={zoneOptions}
          />
          <SelectFilter
            label="Statut"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
        </div>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="dispatchers"
        emptyTitle="Aucun dispatcher"
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
