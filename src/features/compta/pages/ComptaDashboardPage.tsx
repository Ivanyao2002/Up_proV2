"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA } from "@/shared/lib/format";
import { useAdminFinanceDashboard } from "@/features/finance/api/financeDashboard.queries";
import { FinanceDashboardSkeleton } from "@/shared/ui/skeletons";

const QUICK_LINKS = [
  { href: "/compta/ledger", label: "Journal comptable", hint: "Écritures immuables" },
  { href: "/compta/flows", label: "Flux entrées / sorties", hint: "Agrégation par nature" },
  { href: "/compta/wallets", label: "Portefeuilles", hint: "Soldes retirable / service" },
  { href: "/compta/reconciliation", label: "Réconciliation", hint: "Paiements & écarts" },
  { href: "/compta/periods", label: "Clôtures & périodes", hint: "Fermeture comptable" },
  { href: "/compta/withdrawals", label: "Retraits", hint: "Consultation seule" },
  { href: "/compta/exports", label: "Exports", hint: "CSV / Excel" },
];

export function ComptaDashboardPage() {
  const { data, isLoading, isError } = useAdminFinanceDashboard(null);

  if (isLoading && !data) {
    return <FinanceDashboardSkeleton title="Comptabilité" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger le tableau de bord comptable.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Comptabilité" breadcrumb={["Comptabilité", "Tableau de bord"]} />
      <p className="mb-6 text-sm text-muted">
        Consultation, rapprochement et clôture — sans exécution des paiements.
      </p>

      <div className="mb-6 rounded-card border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        Ce portail est en <strong>lecture seule</strong> sur les retraits et recharges. Les
        validations opérationnelles restent dans{" "}
        <Link href="/admin/finance" className="font-medium text-teal underline">
          Finance admin
        </Link>
        .
      </div>

      <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Crédits du jour"
          value={formatFCFA(data.credits_today_fcfa)}
          hint="Entrées ledger"
        />
        <KpiCard
          index={1}
          label="Débits du jour"
          value={formatFCFA(data.debits_today_fcfa)}
          hint="Sorties ledger"
        />
        <KpiCard
          index={2}
          label="Commissions du mois"
          value={formatFCFA(data.commissions_month_fcfa)}
          hint="Prélèvements plateforme"
        />
        <KpiCard
          index={3}
          label="Retraits en attente"
          value={String(data.withdrawals_pending_count)}
          hint={
            data.withdrawals_pending_fcfa > 0
              ? `${formatFCFA(data.withdrawals_pending_fcfa)} — info seulement`
              : "Aucun retrait pending"
          }
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-heading">Accès rapides</h2>
          <ul className="mt-4 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:border-teal/40 hover:bg-canvas/60"
                >
                  <span className="font-medium text-foreground">{link.label}</span>
                  <span className="text-xs text-muted">{link.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-heading">Contrôles du jour</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>Recharges confirmées vs créditées sur wallet</li>
            <li>Commissions calculées / débitées / échouées</li>
            <li>Wallets insuffisants ou négatifs (retirable)</li>
            <li>Écarts de réconciliation non justifiés</li>
            <li>Transactions en attente (PENDING, PROCESSING)</li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Les contrôles automatisés complets seront branchés sur{" "}
            <code className="rounded bg-canvas px-1">GET /v1/admin/accounting/dashboard</code> (Phase
            2).
          </p>
        </section>
      </div>
    </div>
  );
}
