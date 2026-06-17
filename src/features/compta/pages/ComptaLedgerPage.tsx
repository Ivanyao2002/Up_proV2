"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
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
import { ComptaPageHero } from "../components/ComptaPageHero";
import {
  ledgerEntryTypeLabel,
  ledgerSourceTypeLabel,
  ledgerStatusLabel,
} from "../api/compta.mapper";
import { useLedgerExport, useLedgerList, useReverseLedgerEntry } from "../api/ledger.queries";
import { useComptaMe } from "../api/comptaPortal.queries";
import { useComptaApiScope } from "../api/useComptaApiScope";
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
  breadcrumb = ["Comptabilité", "Journal"],
  transactionsHref,
  showReverse = true,
}: {
  title?: string;
  breadcrumb?: string[];
  /** Lien croisé journal ↔ transactions (admin : `/admin/finance/transactions`). */
  transactionsHref?: string;
  showReverse?: boolean;
} = {}) {
  const apiScope = useComptaApiScope();
  const isPortal = apiScope === "portal";
  const { data: me } = useComptaMe();
  const countryLabel =
    me?.accountant?.country?.name ??
    me?.country?.name ??
    (me?.admin ? "Tous pays" : undefined);
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

  const crossLinkHref =
    transactionsHref ??
    (title === "Journal comptable" ? "/compta/transactions" : "/compta/ledger");
  const crossLinkLabel =
    title === "Journal comptable"
      ? "Voir les transactions détaillées"
      : "Voir le journal comptable";

  const columns = showReverse ? [...baseColumns, actionsColumn] : baseColumns;

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader title={title} breadcrumb={breadcrumb} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-card">
          <p className="text-sm text-red-600">Impossible de charger le journal comptable.</p>
          <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
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
            {exportLedger.isPending ? "Export en cours…" : "Exporter CSV"}
          </Button>
        }
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Source de vérité comptable — écritures immuables, extournes et filtres par périmètre.
      </p>

      <div className="animate-stagger space-y-6">
        <ComptaPageHero
          kicker="Journal ledger"
          title="Écritures comptables"
          description="Consultez, filtrez et exportez les mouvements enregistrés sur votre périmètre."
          countryLabel={countryLabel}
          stats={[
            { value: formatFCFA(data?.summary?.credits_xof ?? 0), label: "Crédits" },
            { value: formatFCFA(data?.summary?.debits_xof ?? 0), label: "Débits" },
            { value: String(meta?.total ?? rows.length), label: "Lignes" },
          ]}
        />

        <section className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <TableFiltersBar
              search={table.search}
              onSearchChange={table.setSearch}
              searchPlaceholder="Rechercher réf., propriétaire, description…"
              hasActiveFilters={hasActiveFilters}
              onReset={resetAll}
            >
              {!isPortal || (data?.filter_options?.franchises?.length ?? 0) > 0 ? (
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
              ) : null}
            </TableFiltersBar>

            <div className="mt-4 flex flex-wrap gap-2">
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
          </div>

          <div className="px-2 pb-2">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(row) => row.id}
              isLoading={isLoading}
              exportFileName="journal-comptable"
              serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
              emptyTitle="Aucune écriture"
              emptyDescription="Aucune écriture sur cette période ou ces filtres."
              pagination={false}
            />
          </div>
        </section>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 border-t border-border pt-6 text-xs text-muted"
          aria-label="Raccourcis journal"
        >
          {showReverse ? (
            <>
              <span>Actions :</span>
              <span>extourne depuis une ligne du tableau</span>
              <span aria-hidden>·</span>
            </>
          ) : null}
          <Link href={crossLinkHref} className="font-medium text-teal hover:underline">
            {crossLinkLabel}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/compta/flows" className="font-medium text-teal hover:underline">
            Flux entrées / sorties
          </Link>
          <span aria-hidden>·</span>
          <Link href="/compta/exports" className="font-medium text-teal hover:underline">
            Exports
          </Link>
        </nav>
      </div>

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
