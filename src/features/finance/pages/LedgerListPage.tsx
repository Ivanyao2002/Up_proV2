"use client";

import { TransactionsListPage } from "./TransactionsListPage";

/** Ledger comptable admin — réutilise la liste transactions (entrées immuables). */
export function LedgerListPage() {
  return (
    <TransactionsListPage
      title="Ledger comptable"
      subtitle="Journal des écritures financières (crédits, débits, commissions). Source : GET /v1/admin/ledger ou transactions."
      breadcrumb={["Admin", "Finance", "Ledger"]}
      defaultTypeFilter="all"
      hideSummary
    />
  );
}
