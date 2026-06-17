"use client";

import { TransactionsListPage } from "@/features/finance/pages/TransactionsListPage";

export function ComptaTransactionsPage() {
  return (
    <TransactionsListPage
      title="Transactions détaillées"
      subtitle="Consultation lecture seule — même source que le journal opérationnel."
      breadcrumb={["Comptabilité", "Transactions"]}
      transactionDetailBasePath="/admin/finance/transactions"
    />
  );
}
