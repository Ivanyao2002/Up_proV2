"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { NavIcon, type NavIconName } from "@/portals/shared/NavIcon";
import { ComptaExportsHero } from "../components/ComptaExportsHero";
import { useComptaLedgerExport, useComptaReportsExport } from "../api/comptaExport.queries";
import { useComptaMe } from "../api/comptaPortal.queries";

const MODULE_EXPORTS = [
  {
    id: "flows",
    title: "Flux entrées / sorties",
    description: "Agrégation par nature d'écriture avec export CSV local depuis le tableau.",
    icon: "transactions" as const,
    format: "CSV local",
    href: "/compta/flows",
  },
  {
    id: "transactions",
    title: "Transactions détaillées",
    description: "Même source que le journal — consultez et exportez depuis la liste.",
    icon: "transactions" as const,
    format: "CSV local",
    href: "/compta/transactions",
  },
  {
    id: "wallets",
    title: "Portefeuilles",
    description: "Consultez les soldes et exportez depuis le module portefeuilles.",
    icon: "wallet" as const,
    format: "CSV local",
    href: "/compta/wallets",
  },
  {
    id: "reconciliation",
    title: "Réconciliation",
    description: "Écarts paiements et cash — export depuis le tableau du module.",
    icon: "reconciliation" as const,
    format: "CSV local",
    href: "/compta/reconciliation",
  },
] as const;

function ExportCardShell({
  icon,
  title,
  description,
  format,
  badge,
  children,
}: {
  icon: NavIconName;
  title: string;
  description: string;
  format: string;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal-dark">
          <NavIcon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-heading">{title}</h3>
            {badge}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
          <p className="mt-2 text-xs font-medium text-muted/80">{format}</p>
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function ComptaExportsPage() {
  const exportLedger = useComptaLedgerExport();
  const exportReports = useComptaReportsExport();
  const { data: me } = useComptaMe();

  const countryLabel =
    me?.accountant?.country?.name ??
    me?.country?.name ??
    (me?.admin ? "Tous pays" : undefined);

  function runLedgerExport() {
    exportLedger.mutate({ per_page: 500 });
  }

  function runReportsExport() {
    exportReports.mutate({});
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Rapports & exports" breadcrumb={["Comptabilité", "Exports"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Téléchargez vos données comptables et accédez aux exports depuis les modules du portail.
      </p>

      <div className="animate-stagger space-y-8">
        <ComptaExportsHero countryLabel={countryLabel} />

        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-heading">Téléchargements disponibles</h2>
            <p className="mt-0.5 text-xs text-muted">Exports prêts à l&apos;emploi</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ExportCardShell
              icon="finance"
              title="Journal comptable"
              description="Export CSV serveur de toutes les écritures ledger de votre pays, prêt pour Excel ou import comptable."
              format="CSV · jusqu'à 10 000 lignes"
            >
              <Button
                className="w-full"
                disabled={exportLedger.isPending}
                onClick={runLedgerExport}
              >
                {exportLedger.isPending ? "Préparation du fichier…" : "Télécharger le journal"}
              </Button>
            </ExportCardShell>

            <ExportCardShell
              icon="reports"
              title="Rapports agrégés"
              description="Synthèse mensuelle multi-postes en un seul fichier CSV, scopée sur votre pays."
              format="CSV serveur"
            >
              <Button
                className="w-full"
                variant="secondary"
                disabled={exportReports.isPending}
                onClick={runReportsExport}
              >
                {exportReports.isPending ? "Préparation du fichier…" : "Télécharger le rapport"}
              </Button>
            </ExportCardShell>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-heading">Exports depuis les modules</h2>
            <p className="mt-0.5 text-xs text-muted">CSV local depuis chaque tableau</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MODULE_EXPORTS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group block h-full transition-transform duration-200 hover:-translate-y-0.5"
              >
                <ExportCardShell
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  format={item.format}
                >
                  <span className="inline-flex text-sm font-medium text-teal group-hover:underline">
                    Ouvrir le module →
                  </span>
                </ExportCardShell>
              </Link>
            ))}
          </div>
        </section>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 border-t border-border pt-6 text-xs text-muted"
          aria-label="Raccourcis exports"
        >
          <span>Sources :</span>
          <Link href="/compta/ledger" className="font-medium text-teal hover:underline">
            Journal comptable
          </Link>
          <span aria-hidden>·</span>
          <Link href="/compta/periods" className="font-medium text-teal hover:underline">
            Clôtures & périodes
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
