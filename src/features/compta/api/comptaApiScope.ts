import { LINKS } from "@/core/api/links";

/** `portal` = routes `/v1/compta/*` ; `admin` = routes `/v1/admin/*`. */
export type ComptaApiScope = "portal" | "admin";

export const comptaLedgerLinks = (scope: ComptaApiScope) =>
  scope === "portal" ? LINKS.compta.v1 : LINKS.admin.v1.finance;

export const comptaPeriodLinks = (scope: ComptaApiScope) =>
  scope === "portal" ? LINKS.compta.v1 : LINKS.admin.v1.accounting;

export const comptaFinanceLinks = (scope: ComptaApiScope) => {
  if (scope === "portal") {
    return {
      commissions: LINKS.compta.v1.commissions,
      wallets: LINKS.compta.v1.wallets,
      transactions: LINKS.compta.v1.transactions,
      transactionById: LINKS.compta.v1.transactionById,
      reconciliation: LINKS.compta.v1.reconciliation,
      cashReconciliations: LINKS.compta.v1.cashReconciliations,
      withdrawals: LINKS.compta.v1.withdrawals,
      withdrawalById: LINKS.compta.v1.withdrawalById,
      driverTransfers: LINKS.compta.v1.driverTransfers,
      driverTransferStats: LINKS.compta.v1.driverTransferStats,
      filterOptions: LINKS.compta.v1.filterOptions,
      reportsExport: LINKS.compta.v1.reportsExport,
    };
  }

  return {
    commissions: LINKS.admin.v1.finance.commissions,
    wallets: LINKS.admin.v1.finance.wallets,
    transactions: LINKS.admin.v1.finance.transactions,
    transactionById: LINKS.admin.v1.finance.transactionById,
    reconciliation: LINKS.admin.v1.finance.reconciliation,
    cashReconciliations: LINKS.admin.v1.accounting.cashReconciliations,
    withdrawals: LINKS.admin.v1.withdrawals,
    withdrawalById: LINKS.admin.v1.withdrawalById,
    driverTransfers: LINKS.admin.v1.finance.driverTransfers,
    driverTransferStats: LINKS.admin.v1.finance.driverTransferStats,
    filterOptions: LINKS.admin.v1.filterOptions,
    reportsExport: LINKS.admin.v1.reportsExport,
  };
};
