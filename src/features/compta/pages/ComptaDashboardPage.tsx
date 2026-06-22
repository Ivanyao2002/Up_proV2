"use client";

import Link from "next/link";
import { useAuthStore } from "@/core/auth/authStore";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA } from "@/shared/lib/format";
import { FinanceDashboardSkeleton } from "@/shared/ui/skeletons";
import { ComptaHeroKpi } from "../components/ComptaHeroKpi";
import { ComptaQuickAccessGrid } from "../components/ComptaQuickAccessGrid";
import { ComptaVigilancePanel } from "../components/ComptaVigilancePanel";
import { useComptaDashboard, useComptaMe } from "../api/comptaPortal.queries";

export function ComptaDashboardPage() {
  const userRole = useAuthStore((s) => s.user?.role);
  const { data: me } = useComptaMe();
  const { data, isLoading, isError } = useComptaDashboard();

  const countryLabel =
    me?.accountant?.country?.name ??
    me?.country?.name ??
    (me?.admin ? "Tous pays" : undefined);

  const greetingName =
    me?.accountant?.displayName ??
    me?.accountant?.firstName ??
    me?.accountant?.email?.split("@")[0];

  if (isLoading && !data) {
    return <FinanceDashboardSkeleton title="Tableau de bord" />;
  }

  if (isError || !data) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Tableau de bord" breadcrumb={["Comptabilité"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-card">
          <p className="text-sm text-red-600">Impossible de charger le tableau de bord.</p>
          <Link
            href="/compta"
            className="mt-4 inline-flex text-sm font-medium text-teal hover:underline"
          >
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  const showWithdrawalsAlert = data.withdrawals_pending_count > 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tableau de bord"
        breadcrumb={["Comptabilité", countryLabel ?? "Tableau de bord"]}
      />

      {greetingName || countryLabel ? (
        <p className="-mt-2 mb-6 text-sm text-muted">
          {greetingName ? (
            <>
              Bonjour <span className="font-medium text-foreground">{greetingName}</span>
              {countryLabel ? " — " : ""}
            </>
          ) : null}
          {countryLabel ? (
            <>
              Périmètre <span className="font-medium text-foreground">{countryLabel}</span>
            </>
          ) : null}
          <span className="text-muted"> · consultation et clôture comptable</span>
        </p>
      ) : (
        <p className="-mt-2 mb-6 text-sm text-muted">
          Consultation, rapprochement et clôture — sans exécution des paiements.
        </p>
      )}

      <div className="animate-stagger space-y-6">
        <ComptaHeroKpi
          creditsTodayFcfa={data.credits_today_fcfa}
          debitsTodayFcfa={data.debits_today_fcfa}
          commissionsMonthFcfa={data.commissions_month_fcfa}
          periodLabel={data.period_label}
          periodStatus={data.period_status}
          countryLabel={countryLabel}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            index={0}
            label="Écarts de réconciliation"
            value={String(data.reconciliation_open_gaps)}
            hint={
              data.reconciliation_open_gaps === 0
                ? "Aucun écart ouvert"
                : "À rapprocher ou justifier"
            }
            trend={data.reconciliation_open_gaps > 0 ? "À traiter" : undefined}
            className="h-full"
          />
          <KpiCard
            index={1}
            label="Retraits en attente"
            value={String(data.withdrawals_pending_count)}
            hint={
              data.withdrawals_pending_fcfa > 0
                ? `${formatFCFA(data.withdrawals_pending_fcfa)} en file`
                : "Aucune demande en cours"
            }
            trend={showWithdrawalsAlert ? "Suivi" : undefined}
            className="h-full"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ComptaQuickAccessGrid />
          </div>
          <ComptaVigilancePanel data={data} />
        </div>

        {userRole === "admin" ? (
          <p className="text-center text-xs text-muted">
            Vue administrateur — validations opérationnelles dans{" "}
            <Link href="/admin/finance" className="font-medium text-teal hover:underline">
              Finance admin
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
