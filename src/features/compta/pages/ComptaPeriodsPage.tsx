"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import {
  useAccountingPeriodsList,
  useCloseAccountingPeriod,
} from "../api/accountingPeriods.queries";

export function ComptaPeriodsPage() {
  const { data, isLoading, isError } = useAccountingPeriodsList();
  const closePeriod = useCloseAccountingPeriod();
  const rows = data?.data ?? [];

  function closeDailyPeriod() {
    const confirmed = window.confirm("Clôturer la période journalière courante ?");
    if (!confirmed) return;
    closePeriod.mutate({
      period_type: "daily",
      period_end: new Date().toISOString().slice(0, 10),
      force: false,
    });
  }

  function closeMonthlyPeriod() {
    const confirmed = window.confirm(
      "Clôturer la période mensuelle courante ? Cette action dépend des contrôles backend."
    );
    if (!confirmed) return;
    const periodEnd = new Date().toISOString().slice(0, 10);
    closePeriod.mutate({
      period_type: "monthly",
      period_end: periodEnd,
      force: false,
    });
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Clôtures & verrouillage" breadcrumb={["Comptabilité", "Périodes"]} />
      <p className="mb-6 text-sm text-muted">
        Fermeture et verrouillage des périodes comptables.
      </p>

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Routes branchées:{" "}
            <code className="rounded bg-canvas px-1">GET /v1/admin/accounting/periods</code>{" "}
            et{" "}
            <code className="rounded bg-canvas px-1">POST /v1/admin/accounting/periods/close</code>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={closeDailyPeriod}
              disabled={closePeriod.isPending}
            >
              Clôturer journée
            </Button>
            <Button onClick={closeMonthlyPeriod} disabled={closePeriod.isPending}>
              {closePeriod.isPending ? "Clôture..." : "Clôturer mois"}
            </Button>
          </div>
        </div>
        {isLoading ? <p className="text-sm text-muted">Chargement des périodes...</p> : null}
        {isError ? (
          <p className="text-sm text-red-600">
            Impossible de charger les périodes via l&apos;API comptable.
          </p>
        ) : null}
        {!isLoading && !isError && rows.length === 0 ? (
          <p className="text-sm text-muted">Aucune période renvoyée par l&apos;API pour le moment.</p>
        ) : null}
        {!isLoading && !isError && rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th className="px-2 py-2">Période</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Statut</th>
                  <th className="px-2 py-2">Début</th>
                  <th className="px-2 py-2">Fin</th>
                  <th className="px-2 py-2">Clôturée le</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((period) => (
                  <tr key={period.id} className="border-b border-border/70">
                    <td className="px-2 py-2 font-medium">{period.label}</td>
                    <td className="px-2 py-2">{period.period_type ?? "—"}</td>
                    <td className="px-2 py-2 capitalize">{period.status}</td>
                    <td className="px-2 py-2">{period.period_start ?? "—"}</td>
                    <td className="px-2 py-2">{period.period_end ?? "—"}</td>
                    <td className="px-2 py-2">
                      {period.closed_at ? formatDateTime(period.closed_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="mt-4 text-sm text-muted">
          En attendant, vérifiez les écarts ouverts dans{" "}
          <Link href="/compta/reconciliation" className="text-teal underline">
            Réconciliation
          </Link>{" "}
          et le{" "}
          <Link href="/compta/ledger" className="text-teal underline">
            journal comptable
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
