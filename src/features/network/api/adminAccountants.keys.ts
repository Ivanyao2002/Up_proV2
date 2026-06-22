import type { ListParams } from "@/shared/types/listParams";

export const adminAccountantsKeys = {
  all: ["admin-accountants"] as const,
  list: (params?: ListParams) => ["admin-accountants", "list", params] as const,
  detail: (id: string) => ["admin-accountants", "detail", id] as const,
};
