import type { ListParams } from "@/shared/types/listParams";

export const disputeKeys = {
  all:    ["disputes"] as const,
  list:   (params?: ListParams) => ["disputes", "list", params] as const,
  detail: (id: string)          => ["disputes", "detail", id] as const,
};
