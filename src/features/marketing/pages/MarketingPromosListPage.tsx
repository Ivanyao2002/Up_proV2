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
import type { MarketingPromo } from "../api/marketing.service";
import { useMarketingPromos } from "../api/marketing.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "active" as const, label: "Actifs" },
  { value: "draft" as const, label: "Brouillons" },
  { value: "expired" as const, label: "Expirés" },
];

export function MarketingPromosListPage() {
  const [statusFilter, setStatusFilter] = useState<MarketingPromo["status"] | "all">("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useMarketingPromos(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<MarketingPromo>[] = [
    {
      id: "code",
      header: "Code",
      cell: (p) => (
        <div>
          <p className="font-mono font-medium text-foreground">{p.code}</p>
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
          : `${p.discount_pct} %`,
      exportValue: (p) => p.discount_pct || p.fixed_discount_fcfa || 0,
    },
    {
      id: "uses",
      header: "Utilisations",
      className: "tabular-nums",
      cell: (p) => `${p.uses_count.toLocaleString("fr-CI")} / ${p.max_uses.toLocaleString("fr-CI")}`,
      exportValue: (p) => p.uses_count,
    },
    {
      id: "expires",
      header: "Expire",
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
    return <p className="text-sm text-red-600">Impossible de charger les promos.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Codes promo"
        breadcrumb={["Admin", "Marketing"]}
        actions={
          <Link href="/admin/marketing/promos/new">
            <Button>Nouveau code</Button>
          </Link>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Code, libellé, zone…"
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
        exportFileName="promos-marketing"
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
