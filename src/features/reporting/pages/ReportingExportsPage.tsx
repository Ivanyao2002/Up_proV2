"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { NavIcon, type NavIconName } from "@/portals/shared/NavIcon";
import { useComptaLedgerExport, useComptaReportsExport } from "@/features/compta/api/comptaExport.queries";

const MODULE_EXPORTS = [
  {
    id: "transactions",
    title: "Transactions",
    description: "Liste détaillée avec export CSV depuis le tableau.",
    icon: "transactions" as NavIconName,
    href: "/admin/finance/transactions",
  },
  {
    id: "wallets",
    title: "Portefeuilles",
    description: "Soldes plateforme, partenaires et chauffeurs.",
    icon: "wallet" as NavIconName,
    href: "/admin/finance/wallets",
  },
  {
    id: "finance-dash",
    title: "Dashboard finance",
    description: "GMV, commissions et alertes de réconciliation.",
    icon: "finance" as NavIconName,
    href: "/admin/finance",
  },
  {
    id: "reconciliation",
    title: "Réconciliation",
    description: "Écarts cash et paiements à investiguer.",
    icon: "reconciliation" as NavIconName,
    href: "/admin/finance/reconciliation",
  },
] as const;

export function ReportingExportsPage() {
  const exportLedger = useComptaLedgerExport();
  const exportReports = useComptaReportsExport();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Rapports & exports" breadcrumb={["Reporting", "Exports"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Téléchargements CSV serveur et accès aux tableaux exportables de la plateforme.
      </p>

      <div className="kpi-card mb-8 rounded-card border border-border bg-gradient-to-br from-navy to-navy/90 p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Exports consolidés
        </p>
        <h2 className="mt-2 text-lg font-bold">22 rapports plan recette</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Journal comptable, synthèses mensuelles et exports par module — format CSV prêt
          pour Excel ou outil BI.
        </p>
      </div>

      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-heading">Téléchargements directs</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal-dark">
                <NavIcon name="finance" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-heading">Journal comptable</h3>
                <p className="mt-1 text-sm text-muted">
                  Export CSV serveur des écritures ledger.
                </p>
                <Button
                  className="mt-4 w-full"
                  disabled={exportLedger.isPending}
                  onClick={() => exportLedger.mutate({ per_page: 500 })}
                >
                  {exportLedger.isPending ? "Préparation…" : "Télécharger le journal"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal-dark">
                <NavIcon name="reports" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-heading">Rapports agrégés</h3>
                <p className="mt-1 text-sm text-muted">
                  Synthèse mensuelle multi-postes en CSV.
                </p>
                <Button
                  className="mt-4 w-full"
                  variant="secondary"
                  disabled={exportReports.isPending}
                  onClick={() => exportReports.mutate({})}
                >
                  {exportReports.isPending ? "Préparation…" : "Télécharger le rapport"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-heading">Exports depuis les modules</h2>
          <p className="mt-0.5 text-xs text-muted">CSV local via bouton export des tableaux</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MODULE_EXPORTS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-teal/35"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal-dark">
                <NavIcon name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-heading group-hover:text-teal-dark">
                {item.title}
              </h3>
              <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>
              <span className="mt-3 text-sm font-medium text-teal group-hover:underline">
                Ouvrir →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
