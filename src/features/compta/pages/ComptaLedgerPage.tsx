"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import {
  TripsScopeFilters,
  type TripsScopeFiltersValue,
} from "@/features/ops/components/TripsScopeFilters";
import { ReverseLedgerModal } from "../components/ReverseLedgerModal";
import {
  ledgerEntryTypeLabel,
  ledgerSourceTypeLabel,
  ledgerStatusLabel,
} from "../api/compta.mapper";
import { useLedgerExport, useLedgerList, useReverseLedgerEntry } from "../api/ledger.queries";
import type { LedgerEntry } from "../api/compta.types";

const DIRECTION_FILTERS = [
  { value: "all" as const, label: "Toutes directions" },
  { value: "credit" as const, label: "Crédits" },
  { value: "debit" as const, label: "Débits" },
];

const BUCKET_FILTERS = [
  { value: "all" as const, label: "Tous buckets" },
  { value: "WITHDRAWABLE" as const, label: "Retirable" },
  { value: "NON_WITHDRAWABLE" as const, label: "Service" },
];

const ENTRY_TYPE_FILTERS = [
  { value: "all", label: "Toutes natures" },
  { value: "wallet_recharge", label: "Recharges" },
  { value: "partner_driver_recharge", label: "Recharges partenaire" },
  { value: "ride_commission", label: "Commissions" },
  { value: "withdrawal", label: "Retraits" },
  { value: "performance_bonus", label: "Bonus" },
  { value: "reversal", label: "Extournes" },
];

export function ComptaLedgerPage({
  title = "Journal comptable",
  breadcrumb = ["Comptabilité", "Ledger"],
  transactionsHref = "/compta/transactions",
  showReverse = true,
}: {
  title?: string;
  breadcrumb?: string[];
  transactionsHref?: string;
  showReverse?: boolean;
} = {}) {
  const [directionFilter, setDirectionFilter] = useState<"all" | "credit" | "debit">("all");
  const [bucketFilter, setBucketFilter] = useState<"all" | "WITHDRAWABLE" | "NON_WITHDRAWABLE">(
    "all"
  );
  const [entryTypeFilter, setEntryTypeFilter] = useState("all");
  const [scope, setScope] = useState<TripsScopeFiltersValue>({
    franchiseId: null,
    partnerId: null,
  });
  const [reverseEntry, setReverseEntry] = useState<LedgerEntry | null>(null);

  const table = useServerTableState(
    [directionFilter, bucketFilter, entryTypeFilter, scope.franchiseId, scope.partnerId],
    {
      direction: directionFilter !== "all" ? directionFilter : undefined,
      balance_bucket: bucketFilter !== "all" ? bucketFilter : undefined,
      entry_type: entryTypeFilter !== "all" ? entryTypeFilter : undefined,
      franchise_id: scope.franchiseId ?? undefined,
      partner_id: scope.partnerId ?? undefined,
    }
  );

  const scopeActive = scope.franchiseId != null || scope.partnerId != null;

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: directionFilter, defaultValue: "all", reset: () => setDirectionFilter("all") },
      { value: bucketFilter, defaultValue: "all", reset: () => setBucketFilter("all") },
      { value: entryTypeFilter, defaultValue: "all", reset: () => setEntryTypeFilter("all") },
      {
        value: scopeActive,
        defaultValue: false,
        reset: () => setScope({ franchiseId: null, partnerId: null }),
      },
    ],
  });

  const { data, isLoading, isError } = useLedgerList(table.listParams);
  const exportLedger = useLedgerExport();
  const reverseLedger = useReverseLedgerEntry();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const baseColumns: Column<LedgerEntry>[] = useMemo(
    () => [
      {
        id: "posted_at",
        header: "Date",
        className: "whitespace-nowrap text-muted",
        cell: (row) => formatDateTime(row.posted_at),
        exportValue: (row) => formatDateTime(row.posted_at),
      },
      {
        id: "txn_id",
        header: "Réf. txn",
        cell: (row) => (
          <span className="font-mono text-xs">
            {row.txn_id?.slice(0, 12) ?? row.id.slice(0, 8)}
          </span>
        ),
        exportValue: (row) => row.txn_id ?? row.id,
      },
      {
        id: "entry_type",
        header: "Nature",
        cell: (row) => <span className="text-sm">{ledgerEntryTypeLabel(row.entry_type)}</span>,
        exportValue: (row) => ledgerEntryTypeLabel(row.entry_type),
      },
      {
        id: "direction",
        header: "Sens",
        cell: (row) => (
          <span className={row.direction === "credit" ? "text-emerald-700" : "text-red-700"}>
            {row.direction === "credit" ? "Crédit" : "Débit"}
          </span>
        ),
        exportValue: (row) => row.direction,
      },
      {
        id: "amount",
        header: "Montant",
        className: "tabular-nums font-medium",
        cell: (row) => formatFCFA(row.amount_xof),
        exportValue: (row) => row.amount_xof,
      },
      {
        id: "balance_bucket",
        header: "Bucket",
        cell: (row) => {
          if (!row.balance_bucket) return "—";
          return row.balance_bucket === "WITHDRAWABLE" ? "Retirable" : "Service";
        },
        exportValue: (row) => row.balance_bucket ?? "",
      },
      {
        id: "owner",
        header: "Propriétaire",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.owner_name ?? "—"}</p>
            <p className="text-xs text-muted">{row.franchise_name}</p>
          </div>
        ),
        exportValue: (row) => `${row.owner_name ?? ""} (${row.franchise_name ?? ""})`,
      },
      {
        id: "source",
        header: "Source",
        cell: (row) => (
          <div className="text-xs text-muted">
            {ledgerSourceTypeLabel(row.source_type)}
            {row.order_ref ? ` · ${row.order_ref}` : null}
          </div>
        ),
        exportValue: (row) =>
          `${ledgerSourceTypeLabel(row.source_type)}${row.order_ref ? ` · ${row.order_ref}` : ""}`,
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) => <span className="text-sm">{ledgerStatusLabel(row.status)}</span>,
        exportValue: (row) => ledgerStatusLabel(row.status),
      },
    ],
    []
  );

  const actionsColumn: Column<LedgerEntry> = {
    id: "actions",
    header: "",
    exportValue: () => "",
    cell: (row) => {
      const canReverse =
        row.status === "posted" &&
        row.entry_type !== "reversal" &&
        row.direction !== undefined;
      if (!canReverse) return <span className="text-xs text-muted">—</span>;
      return (
        <Button
          variant="secondary"
          className="!py-1 !px-2 !text-xs"
          onClick={() => setReverseEntry(row)}
        >
          Extourner
        </Button>
      );
    },
  };

  const columns = showReverse ? [...baseColumns, actionsColumn] : baseColumns;

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger le journal comptable.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={title}
        breadcrumb={breadcrumb}
        actions={
          <Button
            variant="secondary"
            disabled={exportLedger.isPending}
            onClick={() => exportLedger.mutate(table.listParams)}
          >
            {exportLedger.isPending ? "Export…" : "Export API (CSV)"}
          </Button>
        }
      />
      <p className="mb-6 text-sm text-muted">
        Source de vérité — GET /v1/admin/ledger (écritures immuables).
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          index={0}
          label="Crédits (page)"
          value={formatFCFA(data?.summary?.credits_xof ?? 0)}
        />
        <KpiCard
          index={1}
          label="Débits (page)"
          value={formatFCFA(data?.summary?.debits_xof ?? 0)}
        />
        <KpiCard
          index={2}
          label="Lignes"
          value={String(meta?.total ?? rows.length)}
          hint="Export CSV local ou API"
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher réf., propriétaire, description…"
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <TripsScopeFilters
          options={
            data?.filter_options ?? {
              franchises: [],
              partners: [],
            }
          }
          value={scope}
          onChange={setScope}
        />
      </TableFiltersBar>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChips
          options={DIRECTION_FILTERS}
          value={directionFilter}
          onChange={setDirectionFilter}
        />
        <FilterChips options={BUCKET_FILTERS} value={bucketFilter} onChange={setBucketFilter} />
        <FilterChips
          options={ENTRY_TYPE_FILTERS}
          value={entryTypeFilter}
          onChange={setEntryTypeFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        exportFileName="journal-comptable"
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
        emptyTitle="Aucune écriture ledger"
        emptyDescription="Aucune écriture sur cette période ou ces filtres."
        pagination={false}
      />

      <p className="mt-4 text-xs text-muted">
        {showReverse ? (
          <>
            Extournes via{" "}
            <code className="rounded bg-canvas px-1">
              POST /v1/admin/ledger/{"{id}"}/reverse
            </code>
            .{" "}
          </>
        ) : null}
        <Link href={transactionsHref} className="text-teal underline">
          Voir aussi les transactions détaillées
        </Link>
        .
      </p>

      <ReverseLedgerModal
        entry={reverseEntry}
        isPending={reverseLedger.isPending}
        onClose={() => setReverseEntry(null)}
        onConfirm={(payload) => {
          if (!reverseEntry) return;
          reverseLedger.mutate(
            { id: reverseEntry.id, ...payload },
            { onSuccess: () => setReverseEntry(null) }
          );
        }}
      />
    </div>
  );
}
