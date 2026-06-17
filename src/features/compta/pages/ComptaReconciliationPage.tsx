"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { FilterChips } from "@/shared/ui/FilterChips";
import { ReconciliationListPage } from "@/features/finance/pages/ReconciliationListPage";
import { ComptaCashReconciliationPanel } from "../components/ComptaCashReconciliationPanel";

const TABS = [
  { value: "payments" as const, label: "Paiements (MM)" },
  { value: "cash" as const, label: "Cash" },
];

export function ComptaReconciliationPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("payments");

  return (
    <div className="animate-fade-up">
      <PageHeader title="Réconciliation" breadcrumb={["Comptabilité", "Réconciliation"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Consultation des écarts paiements et cash — sans action de trésorerie.
      </p>

      <div className="animate-stagger space-y-6">
        <FilterChips options={TABS} value={tab} onChange={setTab} />

        {tab === "payments" ? (
          <ReconciliationListPage
            title="Réconciliation paiements"
            breadcrumb={["Comptabilité", "Réconciliation"]}
            readOnly
            embedded
          />
        ) : (
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-heading">Réconciliation cash</h2>
              <p className="mt-0.5 text-xs text-muted">
                Cash collecté par chauffeur vs montants attendus
              </p>
            </div>
            <ComptaCashReconciliationPanel />
          </section>
        )}
      </div>
    </div>
  );
}
