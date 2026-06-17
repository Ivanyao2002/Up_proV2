import type { ListParams } from "@/shared/types/listParams";

export const comptaKeys = {
  all: ["compta"] as const,
  ledger: {
    all: ["compta", "ledger"] as const,
    list: (params?: ListParams) => ["compta", "ledger", "list", params] as const,
  },
  periods: {
    all: ["compta", "periods"] as const,
    list: () => ["compta", "periods", "list"] as const,
  },
  cashReconciliations: {
    all: ["compta", "cash-reconciliations"] as const,
    list: (params?: ListParams) =>
      ["compta", "cash-reconciliations", "list", params] as const,
  },
};
