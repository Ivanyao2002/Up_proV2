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
      <p className="mb-4 text-sm text-muted">
        Consultation des écarts paiements et cash — sans action de trésorerie.
      </p>
      <div className="mb-6">
        <FilterChips options={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === "payments" ? (
        <ReconciliationListPage
          title=""
          breadcrumb={[]}
          readOnly
          embedded
        />
      ) : (
        <ComptaCashReconciliationPanel />
      )}
    </div>
  );
}
