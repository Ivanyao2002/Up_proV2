/** Routes `/v1/compta/*` branchées côté front (voir docs/comptables.md). */
export const COMPTA_ROUTES_LIVE = {
  me: "/v1/compta/me",
  dashboard: "/v1/compta/dashboard",
  ledger: "/v1/compta/ledger",
  ledgerExport: "/v1/compta/ledger/export",
  ledgerReverse: "/v1/compta/ledger/:id/reverse",
  periods: "/v1/compta/periods",
  periodsClose: "/v1/compta/periods/close",
  periodById: "/v1/compta/periods/:id",
  periodLock: "/v1/compta/periods/:id/lock",
  commissions: "/v1/compta/commissions",
  wallets: "/v1/compta/wallets",
  transactions: "/v1/compta/transactions",
  reconciliation: "/v1/compta/reconciliation",
  cashReconciliations: "/v1/compta/cash-reconciliations",
  withdrawals: "/v1/compta/withdrawals",
  driverTransfers: "/v1/compta/driver-transfers",
  driverTransferStats: "/v1/compta/driver-transfers/stats",
  filterOptions: "/v1/compta/filter-options",
  reportsExport: "/v1/compta/reports/export",
} as const;

/** Conservé pour référence — toutes les routes demandées sont live. */
export const COMPTA_ROUTES_PENDING = {} as const;

export type ComptaPendingRouteKey = never;
