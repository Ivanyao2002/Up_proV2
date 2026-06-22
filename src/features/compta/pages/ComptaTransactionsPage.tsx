"use client";

import { ComptaLedgerPage } from "./ComptaLedgerPage";

export function ComptaTransactionsPage() {
  return (
    <ComptaLedgerPage
      title="Transactions détaillées"
      breadcrumb={["Comptabilité", "Transactions"]}
      showReverse={false}
    />
  );
}
