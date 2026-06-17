"use client";

import { ComptaLedgerPage } from "@/features/compta/pages/ComptaLedgerPage";

/** Ledger comptable admin — source GET /v1/admin/ledger */
export function LedgerListPage() {
  return (
    <ComptaLedgerPage
      title="Ledger comptable"
      breadcrumb={["Admin", "Finance", "Ledger"]}
      transactionsHref="/admin/finance/transactions"
      showReverse
    />
  );
}
