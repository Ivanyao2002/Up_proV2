"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { AdminDashboardFranchiseSelect } from "@/features/ops/components/AdminDashboardFranchiseSelect";
import { formatFCFA } from "@/shared/lib/format";
import { useAdminFinanceDashboard } from "../api/financeDashboard.queries";
import type { AdminDashboardFranchiseFilter } from "@/features/ops/api/dashboard.types";
import { FinanceChartWeekly } from "../components/FinanceChartWeekly";
import { FinanceAlertsPanel } from "../components/FinanceAlertsPanel";
import { FinanceFranchiseBreakdown } from "../components/FinanceFranchiseBreakdown";
import { FinancePaymentMix } from "../components/FinancePaymentMix";
import { FinanceQuickLinks } from "../components/FinanceQuickLinks";
import { FinanceHeroKpi } from "../components/FinanceHeroKpi";
import { FinanceTreasuryStrip } from "../components/FinanceTreasuryStrip";
import { FinanceDashboardSkeleton } from "@/shared/ui/skeletons";

export function AdminFinanceDashboardPage() {
  const [franchiseId, setFranchiseId] =
    useState<AdminDashboardFranchiseFilter>(null);
  const { data, isLoading, isError, isFetching } = useAdminFinanceDashboard(franchiseId);

  const scopeLabel =
    franchiseId === null
      ? "Réseau global"
      : data?.franchise_options.find((f) => f.id === franchiseId)?.name ?? "Franchise";

  if (isLoading && !data) {
    return <FinanceDashboardSkeleton title="Tableau de bord financier" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger le tableau de bord financier.
      </p>
    );
  }

  const showWithdrawalsKpi = data.withdrawals_pending_count > 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Finance générale"
        breadcrumb={["Admin", "Finance", scopeLabel]}
        actions={
          <AdminDashboardFranchiseSelect
            options={data.franchise_options}
            value={franchiseId}
            onChange={setFranchiseId}
            disabled={isFetching}
          />
        }
      />

      {franchiseId !== null && (
        <p className="mb-4 text-sm text-muted">
          Indicateurs filtrés pour{" "}
          <span className="font-medium text-foreground">{scopeLabel}</span>.
        </p>
      )}

      <div
        className={`animate-stagger space-y-5 ${isFetching ? "opacity-70 transition-opacity" : ""}`}
      >
        <FinanceHeroKpi
          volumeTodayFcfa={data.gmv_today_fcfa}
          creditsTodayFcfa={data.credits_today_fcfa}
          debitsTodayFcfa={data.debits_today_fcfa}
          gmvMonthFcfa={data.gmv_month_fcfa}
          commissionsMonthFcfa={data.commissions_month_fcfa}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinanceChartWeekly data={data.chart_weekly} />
          </div>
          {data.alerts.length > 0 && (
            <FinanceAlertsPanel alerts={data.alerts} />
          )}
        </div>

        <div className="grid w-full gap-5 sm:grid-cols-2">
          <KpiCard
            index={0}
            label="Commissions plateforme"
            value={formatFCFA(data.commissions_month_fcfa)}
            hint={`Take rate ${data.take_rate_pct}%`}
            className="h-full"
          />
          <KpiCard
            index={1}
            label="Retraits en attente"
            value={String(data.withdrawals_pending_count)}
            hint={
              data.withdrawals_pending_fcfa > 0
                ? `${formatFCFA(data.withdrawals_pending_fcfa)} à valider`
                : "Demandes à traiter"
            }
            trend={showWithdrawalsKpi ? "Action requise" : undefined}
            className="h-full"
          />
        </div>

        <FinanceTreasuryStrip
          totalFcfa={data.platform_treasury_fcfa}
          driverFcfa={data.driver_wallets_total_fcfa}
          partnerFcfa={data.partner_wallets_total_fcfa}
          clientFcfa={data.client_wallets_total_fcfa}
        />

        {franchiseId === null && (
          <div className="grid gap-5 lg:grid-cols-2">
            <FinanceFranchiseBreakdown rows={data.by_franchise} />
            <FinancePaymentMix items={data.payment_mix} />
          </div>
        )}

        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Mouvements récents</h2>
              <p className="mt-0.5 text-xs text-muted">Dernières écritures du réseau</p>
            </div>
            <Link
              href="/admin/finance/transactions"
              className="text-xs font-medium text-teal hover:underline"
            >
              Toutes les transactions →
            </Link>
          </div>
          {data.recent_movements.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">
              Aucun mouvement récent.
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {data.recent_movements.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{tx.label}</p>
                    <p className="text-xs capitalize text-muted">{tx.category}</p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold tabular-nums ${
                      tx.direction === "credit" ? "text-teal-dark" : "text-red-600"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "−"}
                    {formatFCFA(tx.amount_fcfa)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FinanceQuickLinks />
      </div>
    </div>
  );
}
