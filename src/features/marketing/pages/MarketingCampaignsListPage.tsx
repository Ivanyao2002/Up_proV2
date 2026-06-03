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
import type { MarketingCampaign } from "../api/marketing.service";
import { useMarketingCampaigns } from "../api/marketing.queries";

const CHANNEL_LABELS: Record<MarketingCampaign["channel"], string> = {
  push: "Push",
  sms: "SMS",
  in_app: "In-app",
  email: "Email",
};

const STATUS_LABELS: Record<MarketingCampaign["status"], string> = {
  running: "En cours",
  scheduled: "Planifiée",
  completed: "Terminée",
  draft: "Brouillon",
};

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "running" as const, label: "En cours" },
  { value: "scheduled" as const, label: "Planifiées" },
  { value: "completed" as const, label: "Terminées" },
  { value: "draft" as const, label: "Brouillons" },
];

export function MarketingCampaignsListPage() {
  const [statusFilter, setStatusFilter] = useState<MarketingCampaign["status"] | "all">(
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

  const { data, isLoading, isError } = useMarketingCampaigns(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<MarketingCampaign>[] = [
    {
      id: "name",
      header: "Campagne",
      cell: (c) => (
        <div>
          <p className="font-medium text-foreground">{c.name}</p>
          <p className="text-xs text-muted">{c.id}</p>
        </div>
      ),
      exportValue: (c) => c.name,
    },
    {
      id: "channel",
      header: "Canal",
      cell: (c) => CHANNEL_LABELS[c.channel],
      exportValue: (c) => CHANNEL_LABELS[c.channel],
    },
    {
      id: "audience",
      header: "Audience",
      cell: (c) => <span className="text-sm text-muted">{c.audience}</span>,
      exportValue: (c) => c.audience,
    },
    {
      id: "sent",
      header: "Envoyés",
      className: "tabular-nums",
      cell: (c) => c.sent_count.toLocaleString("fr-CI"),
      exportValue: (c) => c.sent_count,
    },
    {
      id: "open",
      header: "Ouverture",
      className: "tabular-nums",
      cell: (c) => (c.open_rate_pct > 0 ? `${c.open_rate_pct} %` : "—"),
      exportValue: (c) => c.open_rate_pct,
    },
    {
      id: "period",
      header: "Période",
      cell: (c) => (
        <span className="text-xs text-muted">
          {formatDateTime(c.starts_at)} → {formatDateTime(c.ends_at)}
        </span>
      ),
      exportValue: (c) => c.starts_at,
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "running"
              ? "bg-teal/15 text-teal-dark"
              : c.status === "scheduled"
                ? "bg-navy/10 text-foreground"
                : c.status === "completed"
                  ? "bg-canvas text-muted"
                  : "bg-amber-50 text-amber-700"
          }`}
        >
          {STATUS_LABELS[c.status]}
        </span>
      ),
      exportValue: (c) => STATUS_LABELS[c.status],
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les campagnes.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Campagnes"
        breadcrumb={["Admin", "Marketing"]}
        actions={
          <Link href="/admin/marketing/campaigns/new">
            <Button>Nouvelle campagne</Button>
          </Link>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, audience, canal…"
        totalLabel={meta ? `${meta.total} campagnes` : undefined}
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
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="campagnes-marketing"
        emptyTitle="Aucune campagne"
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
