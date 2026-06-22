"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDateTime } from "@/shared/lib/format";
import { ComptaPeriodsHero } from "../components/ComptaPeriodsHero";
import {
  ComptaPeriodStatusPill,
  formatPeriodType,
} from "../components/ComptaPeriodStatusPill";
import type { AccountingPeriod } from "../api/compta.types";
import {
  useAccountingPeriodsList,
  useCloseAccountingPeriod,
} from "../api/accountingPeriods.queries";
import { useComptaDashboard, useComptaMe } from "../api/comptaPortal.queries";

function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function ComptaPeriodsPage() {
  const { data: me } = useComptaMe();
  const { data: dashboard } = useComptaDashboard();
  const { data, isLoading, isError } = useAccountingPeriodsList();
  const closePeriod = useCloseAccountingPeriod();
  const rows = data?.data ?? [];

  const countryLabel =
    me?.accountant?.country?.name ??
    me?.country?.name ??
    (me?.admin ? "Tous pays" : undefined);

  const { openCount, closedCount } = useMemo(() => {
    let open = 0;
    let closed = 0;
    for (const row of rows) {
      const key = row.status.toLowerCase();
      if (key === "open") open += 1;
      else if (key === "closed" || key === "locked") closed += 1;
    }
    return { openCount: open, closedCount: closed };
  }, [rows]);

  function closeDailyPeriod() {
    const confirmed = window.confirm(
      `Clôturer la période journalière du ${todayLabel()} ?\n\nCette action fige les écritures du jour après contrôle.`
    );
    if (!confirmed) return;
    closePeriod.mutate({
      period_type: "daily",
      period_end: new Date().toISOString().slice(0, 10),
      force: false,
    });
  }

  function closeMonthlyPeriod() {
    const confirmed = window.confirm(
      `Clôturer la période mensuelle de ${currentMonthLabel()} ?\n\nAssurez-vous que les réconciliations et le journal sont à jour.`
    );
    if (!confirmed) return;
    closePeriod.mutate({
      period_type: "monthly",
      period_end: new Date().toISOString().slice(0, 10),
      force: false,
    });
  }

  const columns: Column<AccountingPeriod>[] = [
    {
      id: "label",
      header: "Période",
      cell: (p) => <span className="font-medium text-foreground">{p.label}</span>,
      exportValue: (p) => p.label,
    },
    {
      id: "type",
      header: "Type",
      cell: (p) => formatPeriodType(p.period_type),
      exportValue: (p) => formatPeriodType(p.period_type),
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => <ComptaPeriodStatusPill status={p.status} />,
      exportValue: (p) => p.status,
    },
    {
      id: "start",
      header: "Début",
      className: "whitespace-nowrap text-muted",
      cell: (p) => p.period_start ?? "—",
      exportValue: (p) => p.period_start ?? "",
    },
    {
      id: "end",
      header: "Fin",
      className: "whitespace-nowrap text-muted",
      cell: (p) => p.period_end ?? "—",
      exportValue: (p) => p.period_end ?? "",
    },
    {
      id: "closed",
      header: "Clôturée le",
      className: "whitespace-nowrap text-muted",
      cell: (p) => (p.closed_at ? formatDateTime(p.closed_at) : "—"),
      exportValue: (p) => (p.closed_at ? formatDateTime(p.closed_at) : ""),
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Clôtures & verrouillage" breadcrumb={["Comptabilité", "Périodes"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Pilotez les clôtures journalières et mensuelles de votre périmètre comptable.
      </p>

      <div className="animate-stagger space-y-6">
        <ComptaPeriodsHero
          countryLabel={countryLabel}
          currentPeriodLabel={dashboard?.period_label}
          currentPeriodStatus={dashboard?.period_status}
          openCount={openCount}
          closedCount={closedCount}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Clôture journalière
            </p>
            <h3 className="mt-2 text-lg font-semibold text-heading capitalize">{todayLabel()}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Figez les écritures du jour après vérification du journal et des encaissements.
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={closeDailyPeriod}
              disabled={closePeriod.isPending}
            >
              {closePeriod.isPending ? "Clôture en cours…" : "Clôturer la journée"}
            </Button>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Clôture mensuelle
            </p>
            <h3 className="mt-2 text-lg font-semibold capitalize text-heading">
              {currentMonthLabel()}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Bouclez le mois une fois les écarts de réconciliation traités et le ledger validé.
            </p>
            <Button className="mt-5" onClick={closeMonthlyPeriod} disabled={closePeriod.isPending}>
              {closePeriod.isPending ? "Clôture en cours…" : "Clôturer le mois"}
            </Button>
          </div>
        </div>

        <section className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-heading">Historique des périodes</h2>
              <p className="mt-0.5 text-xs text-muted">
                Journalières et mensuelles sur votre périmètre
              </p>
            </div>
          </div>

          {isError ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-red-600">Impossible de charger les périodes.</p>
              <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Aucune période enregistrée"
                description="Les périodes apparaîtront ici après la première clôture ou dès qu'elles seront initialisées pour votre pays."
              />
            </div>
          ) : (
            <div className="px-2 pb-2">
              <DataTable
                columns={columns}
                data={rows}
                rowKey={(p) => p.id}
                exportFileName="periodes-comptables"
                pagination={false}
                emptyTitle="Aucune période"
              />
            </div>
          )}
        </section>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-muted"
          aria-label="Raccourcis comptables"
        >
          <span>Vérifier avant clôture :</span>
          <Link href="/compta/reconciliation" className="font-medium text-teal hover:underline">
            Réconciliation
          </Link>
          <span aria-hidden>·</span>
          <Link href="/compta/ledger" className="font-medium text-teal hover:underline">
            Journal comptable
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
