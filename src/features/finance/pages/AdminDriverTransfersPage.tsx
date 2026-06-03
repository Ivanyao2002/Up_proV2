"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { PlatformDriverTransfer } from "@/shared/types";
import { DriverTransferStatusBadge } from "@/shared/wallet/driverTransferStatus";
import {
  useAdminDriverRechargeStats,
  useAdminDriverTransfers,
} from "../api/driverTransfers.queries";

const SOURCE_OPTIONS = [
  { value: "all" as const, label: "Toutes sources" },
  { value: "partner" as const, label: "Partenaires" },
  { value: "franchise" as const, label: "Franchises" },
];

export function AdminDriverTransfersPage() {
  const [sourceFilter, setSourceFilter] =
    useState<(typeof SOURCE_OPTIONS)[number]["value"]>("all");

  const table = useServerTableState([sourceFilter], {
    type: sourceFilter !== "all" ? sourceFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      {
        value: sourceFilter,
        defaultValue: "all",
        reset: () => setSourceFilter("all"),
      },
    ],
  });

  const { data: stats, isLoading: statsLoading } = useAdminDriverRechargeStats();
  const { data, isLoading, isError } = useAdminDriverTransfers(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<PlatformDriverTransfer>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <span className="font-mono text-sm font-medium text-foreground">{t.ref}</span>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "owner",
      header: "Émetteur",
      cell: (t) => (
        <div>
          <p className="font-medium text-foreground">{t.owner_name}</p>
          <p className="text-xs capitalize text-muted">{t.source}</p>
        </div>
      ),
      exportValue: (t) => `${t.owner_name} (${t.source})`,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (t) => (
        <div>
          <p className="font-medium text-foreground">{t.driver_name}</p>
          <p className="text-xs text-muted">{t.driver_phone}</p>
        </div>
      ),
      exportValue: (t) => t.driver_name,
    },
    {
      id: "amount",
      header: "Montant",
      cell: (t) => (
        <span className="tabular-nums font-medium text-red-600">
          −{formatFCFA(t.amount_fcfa)}
        </span>
      ),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <DriverTransferStatusBadge status={t.status} />,
      exportValue: (t) => t.status,
    },
    {
      id: "mobile",
      header: "App mobile",
      cell: (t) => (
        <span className="text-sm text-muted">
          {t.mobile_wallet_credited ? "Crédité" : "—"}
        </span>
      ),
      exportValue: (t) => (t.mobile_wallet_credited ? "Oui" : "Non"),
    },
    {
      id: "date",
      header: "Date",
      cell: (t) => (
        <span className="text-sm text-muted">{formatDateTime(t.created_at)}</span>
      ),
      exportValue: (t) => t.created_at,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Recharges chauffeurs"
        breadcrumb={["Admin", "Finance", "Recharges"]}
      />

      <p className="mb-6 max-w-2xl text-sm text-muted">
        Vue plateforme de tous les transferts partenaires et franchises vers les
        portefeuilles mobiles chauffeurs : montants, statuts et historique.
      </p>

      {statsLoading ? (
        <div className="mb-6 h-24 animate-pulse rounded-card bg-border" />
      ) : stats ? (
        <div className="animate-stagger mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total rechargé"
            value={formatFCFA(stats.total_spent_fcfa)}
          />
          <KpiCard
            label="Transferts"
            value={String(stats.transfers_count)}
          />
          <KpiCard
            label="Ce mois"
            value={formatFCFA(stats.month_spent_fcfa)}
            hint={`${stats.month_transfers_count} transfert(s)`}
          />
          <KpiCard
            label="Émetteurs actifs"
            value={`${stats.partners_count} part. · ${stats.franchises_count} fr.`}
          />
        </div>
      ) : null}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., chauffeur, partenaire…"
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Source"
          value={sourceFilter}
          options={SOURCE_OPTIONS}
          onChange={setSourceFilter}
        />
      </TableFiltersBar>

      {isError ? (
        <p className="text-sm text-red-600">
          Impossible de charger les recharges chauffeurs.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyTitle="Aucune recharge"
          exportFileName="recharges-chauffeurs-plateforme"
          serverPagination={serverPaginationFromMeta(
            meta,
            table.setPage,
            table.setPageSize
          )}
        />
      )}
    </div>
  );
}
