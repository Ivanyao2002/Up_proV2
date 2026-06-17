"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA } from "@/shared/lib/format";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { ledgerEntryTypeLabel } from "../api/compta.mapper";
import { useLedgerList } from "../api/ledger.queries";
import type { LedgerFlowRow } from "../api/compta.types";

export function ComptaFlowsPage() {
  const table = useServerTableState([], {});

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
    return <p className="text-sm text-red-600">Impossible de charger les flux comptables.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Flux entrées / sorties" breadcrumb={["Comptabilité", "Flux"]} />
      <p className="mb-6 text-sm text-muted">
        Agrégation par nature d&apos;écriture sur la période courante (500 dernières lignes ledger).
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard index={0} label="Total entrées" value={formatFCFA(totals.credits)} />
        <KpiCard index={1} label="Total sorties" value={formatFCFA(totals.debits)} />
        <KpiCard index={2} label="Solde net" value={formatFCFA(totals.net)} />
      </div>

      <DataTable
        columns={columns}
        data={flowRows}
        rowKey={(row) => row.entry_type}
        isLoading={isLoading}
        exportFileName="flux-comptables"
        emptyTitle="Aucun flux"
        emptyDescription="Aucun flux sur la période."
        pagination={false}
      />

      <p className="mt-4 text-xs text-muted">
        Pour le détail ligne à ligne, consultez le{" "}
        <Link href="/compta/ledger" className="text-teal underline">
          journal comptable
        </Link>
        .
      </p>
    </div>
  );
}
