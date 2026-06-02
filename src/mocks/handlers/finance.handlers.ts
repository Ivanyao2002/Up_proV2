import { http, HttpResponse } from "msw";
import transactions from "../data/transactions.json";
import withdrawals from "../data/withdrawals.json";

export const financeHandlers = [
  http.get("*/api/v2/admin/finance/transactions", () => {
    return HttpResponse.json(transactions);
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
