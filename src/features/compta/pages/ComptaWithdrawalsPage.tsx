"use client";

import { WithdrawalsListPage } from "@/features/finance/pages/WithdrawalsListPage";

export function ComptaWithdrawalsPage() {
  return (
    <WithdrawalsListPage
      title="Retraits"
      breadcrumb={["Comptabilité", "Retraits"]}
      readOnly
      detailBasePath="/compta/withdrawals"
    />
  );
}
