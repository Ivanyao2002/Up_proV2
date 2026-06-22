import type { ListParams } from "@/shared/types/listParams";
import type { ComptaApiScope } from "./comptaApiScope";

export const comptaKeys = {
  all: ["compta"] as const,
  ledger: {
    all: ["compta", "ledger"] as const,
    list: (scope: ComptaApiScope, params?: ListParams) =>
      ["compta", "ledger", "list", scope, params] as const,
  },
  periods: {
    all: ["compta", "periods"] as const,
    list: (scope: ComptaApiScope) => ["compta", "periods", "list", scope] as const,
  },
  cashReconciliations: {
    all: ["compta", "cash-reconciliations"] as const,
    list: (scope: ComptaApiScope, params?: ListParams) =>
      ["compta", "cash-reconciliations", "list", scope, params] as const,
  },
};
