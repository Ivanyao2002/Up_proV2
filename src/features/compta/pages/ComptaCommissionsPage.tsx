"use client";

import { CommissionsListPage } from "@/features/finance/pages/CommissionsListPage";

export function ComptaCommissionsPage() {
  return (
    <CommissionsListPage
      title="Commissions & bénéfices"
      breadcrumb={["Comptabilité", "Commissions"]}
    />
  );
}
