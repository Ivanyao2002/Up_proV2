"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
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
