import { http, HttpResponse } from "msw";
import transactions from "../data/transactions.json";
import withdrawals from "../data/withdrawals.json";
import financeWallets from "../data/finance-wallets.json";
import financeCommissions from "../data/finance-commissions.json";
import financeReconciliation from "../data/finance-reconciliation.json";

export const financeHandlers = [
  http.get("*/api/v2/admin/finance/transactions", () => {
    return HttpResponse.json(transactions);
  }),

  http.get("*/api/v2/admin/finance/wallets", () => {
    return HttpResponse.json(financeWallets);
  }),

  http.get("*/api/v2/admin/finance/commissions", () => {
    return HttpResponse.json(financeCommissions);
  }),

  http.get("*/api/v2/admin/finance/reconciliation", () => {
    return HttpResponse.json(financeReconciliation);
  }),

  http.get("*/api/v2/admin/finance/withdrawals", () => {
    return HttpResponse.json(withdrawals);
  }),

  http.post("*/api/v2/admin/finance/withdrawals/:id/approve", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v2/admin/finance/withdrawals/:id/reject", () => {
    return HttpResponse.json({ ok: true });
  }),
];
