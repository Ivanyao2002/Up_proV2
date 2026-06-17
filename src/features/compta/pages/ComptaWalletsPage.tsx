"use client";

import { WalletsListPage } from "@/features/finance/pages/WalletsListPage";

export function ComptaWalletsPage() {
  return (
    <WalletsListPage
      title="Portefeuilles"
      breadcrumb={["Comptabilité", "Portefeuilles"]}
      ledgerHref="/compta/ledger"
    />
  );
}
