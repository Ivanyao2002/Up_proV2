"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { useComptaLedgerExport, useComptaReportsExport } from "../api/comptaExport.queries";

const EXPORT_TARGETS = [
  {
    id: "ledger-api",
    title: "Journal comptable (API CSV)",
    description: "Export serveur des écritures ledger avec les filtres courants.",
    api: "GET /v1/admin/ledger/export",
    action: "ledger" as const,
  },
  {
    id: "reports-api",
    title: "Rapports génériques (API)",
    description: "Export des rapports admin disponibles côté backend.",
    api: "GET /v1/admin/reports/export",
    action: "reports" as const,
  },
  {
    title: "Flux agrégés (CSV local)",
    description: "Export des flux par nature d'écriture depuis la page Flux.",
    href: "/compta/flows",
    api: "Agrégation client depuis GET /v1/admin/ledger",
  },
  {
    title: "Transactions détaillées",
    description: "Export CSV depuis la liste transactions.",
    href: "/compta/transactions",
    api: "GET /v1/admin/finance/transactions",
  },
  {
    title: "Portefeuilles",
    description: "Soldes retirable / service par acteur.",
    href: "/compta/wallets",
    api: "GET /v1/admin/finance/wallets",
  },
  {
    title: "Réconciliation paiements",
    description: "Export CSV depuis l'onglet paiements.",
    href: "/compta/reconciliation",
    api: "GET /v1/admin/finance/reconciliation",
  },
];

export function ComptaExportsPage() {
  const exportLedger = useComptaLedgerExport();
  const exportReports = useComptaReportsExport();

  function runExport(action: "ledger" | "reports") {
    if (action === "ledger") {
      exportLedger.mutate({ per_page: 500 });
      return;
    }
    exportReports.mutate({});
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Rapports & exports" breadcrumb={["Comptabilité", "Exports"]} />
      <p className="mb-6 text-sm text-muted">
        Exports API branchés sur le Swagger live. Les exports locaux restent disponibles via le
        bouton Exporter de chaque tableau.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {EXPORT_TARGETS.map((item) => {
          const key = "id" in item ? item.id : item.href;
          if ("action" in item && item.action) {
            const pending =
              item.action === "ledger" ? exportLedger.isPending : exportReports.isPending;
            return (
              <div
                key={key}
                className="rounded-card border border-border bg-surface p-5 shadow-card"
              >
                <h2 className="font-semibold text-heading">{item.title}</h2>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
                <p className="mt-3 font-mono text-xs text-muted">{item.api}</p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => runExport(item.action)}
                >
                  {pending ? "Export en cours…" : "Télécharger"}
                </Button>
              </div>
            );
          }

          return (
            <Link
              key={key}
              href={item.href!}
              className="rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-teal/40"
            >
              <h2 className="font-semibold text-heading">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
              <p className="mt-3 font-mono text-xs text-muted">{item.api}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
