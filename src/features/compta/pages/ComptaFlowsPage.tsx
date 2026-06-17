"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { ComptaPageHero } from "../components/ComptaPageHero";
import { ledgerEntryTypeLabel } from "../api/compta.mapper";
import { useLedgerList } from "../api/ledger.queries";
import { useComptaMe } from "../api/comptaPortal.queries";
import type { LedgerFlowRow } from "../api/compta.types";

export function ComptaFlowsPage() {
  const table = useServerTableState([], {});
  const { data: me } = useComptaMe();

  const countryLabel =
    me?.accountant?.country?.name ??
    me?.country?.name ??
    (me?.admin ? "Tous pays" : undefined);

  const { data, isLoading, isError } = useLedgerList({
    ...table.listParams,
    per_page: 500,
  });

  const flowRows = useMemo(() => {
    const map = new Map<string, LedgerFlowRow>();
    for (const entry of data?.data ?? []) {
      const key = entry.entry_type;
      const current = map.get(key) ?? {
        entry_type: key,
        label: ledgerEntryTypeLabel(key),
        credits_xof: 0,
        debits_xof: 0,
        net_xof: 0,
        lines_count: 0,
      };
      if (entry.direction === "credit") {
        current.credits_xof += entry.amount_xof;
      } else {
        current.debits_xof += entry.amount_xof;
      }
      current.net_xof = current.credits_xof - current.debits_xof;
      current.lines_count += 1;
      map.set(key, current);
    }
    return [...map.values()].sort((a, b) => Math.abs(b.net_xof) - Math.abs(a.net_xof));
  }, [data?.data]);

  const totals = useMemo(() => {
    return flowRows.reduce(
      (acc, row) => ({
        credits: acc.credits + row.credits_xof,
        debits: acc.debits + row.debits_xof,
        net: acc.net + row.net_xof,
      }),
      { credits: 0, debits: 0, net: 0 }
    );
  }, [flowRows]);

  const columns: Column<LedgerFlowRow>[] = [
    {
      id: "label",
      header: "Nature",
      cell: (row) => <span className="font-medium">{row.label}</span>,
      exportValue: (row) => row.label,
    },
    {
      id: "lines",
      header: "Lignes",
      className: "tabular-nums",
      cell: (row) => row.lines_count,
      exportValue: (row) => row.lines_count,
    },
    {
      id: "credits",
      header: "Entrées",
      className: "tabular-nums text-emerald-700",
      cell: (row) => formatFCFA(row.credits_xof),
      exportValue: (row) => row.credits_xof,
    },
    {
      id: "debits",
      header: "Sorties",
      className: "tabular-nums text-red-700",
      cell: (row) => formatFCFA(row.debits_xof),
      exportValue: (row) => row.debits_xof,
    },
    {
      id: "net",
      header: "Solde net",
      className: "tabular-nums font-medium",
      cell: (row) => formatFCFA(row.net_xof),
      exportValue: (row) => row.net_xof,
    },
  ];

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Flux entrées / sorties" breadcrumb={["Comptabilité", "Flux"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-card">
          <p className="text-sm text-red-600">Impossible de charger les flux comptables.</p>
          <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Flux entrées / sorties" breadcrumb={["Comptabilité", "Flux"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Agrégation par nature d&apos;écriture sur les 500 dernières lignes du journal.
      </p>

      <div className="animate-stagger space-y-6">
        <ComptaPageHero
          kicker="Synthèse des mouvements"
          title="Flux par nature"
          description="Visualisez les entrées, sorties et soldes nets regroupés par type d'écriture."
          countryLabel={countryLabel}
          variant="charcoal"
          stats={[
            { value: formatFCFA(totals.credits), label: "Entrées" },
            { value: formatFCFA(totals.debits), label: "Sorties" },
            { value: formatFCFA(totals.net), label: "Solde net" },
          ]}
        />

        <section className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-heading">Détail par nature</h2>
            <p className="mt-0.5 text-xs text-muted">Export CSV disponible depuis le tableau</p>
          </div>
          <div className="px-2 pb-2">
            <DataTable
              columns={columns}
              data={flowRows}
              rowKey={(row) => row.entry_type}
              isLoading={isLoading}
              exportFileName="flux-comptables"
              emptyTitle="Aucun flux"
              emptyDescription="Aucun mouvement sur la période analysée."
              pagination={false}
            />
          </div>
        </section>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 border-t border-border pt-6 text-xs text-muted"
          aria-label="Raccourcis flux"
        >
          <span>Approfondir :</span>
          <Link href="/compta/ledger" className="font-medium text-teal hover:underline">
            Journal comptable
          </Link>
          <span aria-hidden>·</span>
          <Link href="/compta/exports" className="font-medium text-teal hover:underline">
            Exports
          </Link>
          <span aria-hidden>·</span>
          <Link href="/compta" className="font-medium text-teal hover:underline">
            Tableau de bord
          </Link>
        </nav>
      </div>
    </div>
  );
}
