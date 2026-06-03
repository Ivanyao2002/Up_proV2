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
import type { MarketingBanner } from "../api/marketing.service";
import { useMarketingBanners } from "../api/marketing.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "active" as const, label: "Actifs" },
  { value: "draft" as const, label: "Brouillons" },
  { value: "archived" as const, label: "Archivés" },
];

export function MarketingBannersListPage() {
  const [statusFilter, setStatusFilter] = useState<MarketingBanner["status"] | "all">(
    "all"
  );

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useMarketingBanners(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<MarketingBanner>[] = [
    {
      id: "title",
      header: "Bannière",
      cell: (b) => (
        <div>
          <p className="font-medium text-foreground">{b.title}</p>
          <p className="text-xs text-muted">{b.placement}</p>
        </div>
      ),
      exportValue: (b) => b.title,
    },
    {
      id: "impressions",
      header: "Impressions",
      className: "tabular-nums",
      cell: (b) => b.impressions.toLocaleString("fr-CI"),
      exportValue: (b) => b.impressions,
    },
    {
      id: "clicks",
      header: "Clics",
      className: "tabular-nums",
      cell: (b) => b.clicks.toLocaleString("fr-CI"),
      exportValue: (b) => b.clicks,
    },
    {
      id: "ctr",
      header: "CTR",
      className: "tabular-nums",
      cell: (b) =>
        b.impressions > 0
          ? `${((b.clicks / b.impressions) * 100).toFixed(1)} %`
          : "—",
      exportValue: (b) => (b.impressions > 0 ? b.clicks / b.impressions : 0),
    },
    {
      id: "period",
      header: "Période",
      cell: (b) => (
        <span className="text-xs text-muted">{formatDateTime(b.ends_at)}</span>
      ),
      exportValue: (b) => b.ends_at,
    },
    {
      id: "status",
      header: "Statut",
      cell: (b) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            b.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : b.status === "archived"
                ? "bg-canvas text-muted"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {b.status === "active" ? "Actif" : b.status === "archived" ? "Archivé" : "Brouillon"}
        </span>
      ),
      exportValue: (b) => b.status,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les bannières.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Bannières"
        breadcrumb={["Admin", "Marketing"]}
        actions={
          <Link href="/admin/marketing/banners/new">
            <Button>Nouvelle bannière</Button>
          </Link>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Titre, emplacement, lien…"
        totalLabel={meta ? `${meta.total} bannières` : undefined}
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
        rowKey={(b) => b.id}
        isLoading={isLoading}
        exportFileName="bannieres-marketing"
        emptyTitle="Aucune bannière"
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
