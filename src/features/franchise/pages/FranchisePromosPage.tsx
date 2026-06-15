"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { FranchisePromo } from "../api/promos.service";
import { useFranchisePromos } from "../api/promos.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "active" as const, label: "Actifs" },
  { value: "draft" as const, label: "Brouillons" },
  { value: "expired" as const, label: "Expirés" },
];

export function FranchisePromosPage() {
  const [statusFilter, setStatusFilter] = useState<FranchisePromo["status"] | "all">("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchisePromos(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FranchisePromo>[] = [
    {
      id: "code",
      header: "Code",
      cell: (p) => (
        <div>
          <Link
            href={`/franchise/promos/${p.id}`}
            className="font-mono font-medium text-foreground hover:text-teal"
          >
            {p.code}
          </Link>
          <p className="text-xs text-muted">{p.label}</p>
        </div>
      ),
      exportValue: (p) => p.code,
    },
    {
      id: "discount",
      header: "Réduction",
      cell: (p) =>
        p.fixed_discount_fcfa
          ? `${p.fixed_discount_fcfa} FCFA`
          : p.discount_pct > 0
            ? `${p.discount_pct} %`
            : "—",
      exportValue: (p) => p.discount_pct || p.fixed_discount_fcfa || 0,
    },
    {
      id: "audience",
      header: "Utilisateurs",
      cell: (p) =>
        p.assigned_users.length === 0 ? (
          <span className="text-sm text-muted">Tous</span>
        ) : (
          <span className="text-sm text-foreground">
            {p.assigned_users.length} ciblé{p.assigned_users.length > 1 ? "s" : ""}
          </span>
        ),
      exportValue: (p) =>
        p.assigned_users.length === 0
          ? "Tous"
          : p.assigned_users.map((u) => u.full_name).join(", "),
    },
    {
      id: "uses",
      header: "Utilisations",
      className: "tabular-nums",
      cell: (p) => `${p.uses_count} / ${p.max_uses}`,
      exportValue: (p) => p.uses_count,
    },
    {
      id: "expires",
      header: "Expire le",
      cell: (p) => formatDateTime(p.expires_at),
      exportValue: (p) => p.expires_at,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            p.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : p.status === "expired"
                ? "bg-canvas text-muted"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {p.status === "active" ? "Actif" : p.status === "expired" ? "Expiré" : "Brouillon"}
        </span>
      ),
      exportValue: (p) => p.status,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les promos.{" "}
        <Link href="/franchise/promos" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  const activeCount = rows.filter((p) => p.status === "active").length;
  const expiredCount = rows.filter((p) => p.status === "expired").length;

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Codes promo territoire"
          breadcrumb={["Franchise", "Marketing", "Codes promo"]}
          actions={
            <Link href="/franchise/promos/new">
              <Button>Nouveau code</Button>
            </Link>
          }
        />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} codes · {activeCount} actif{activeCount > 1 ? "s" : ""} · {expiredCount} expiré{expiredCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Code, libellé…"
        totalLabel={meta ? `${meta.total} codes promo` : undefined}
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
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="promos-franchise"
        emptyTitle="Aucun code promo"
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
