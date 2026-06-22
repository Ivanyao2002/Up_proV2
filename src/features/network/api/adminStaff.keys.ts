import type { AdminStaffKind } from "./adminStaff.config";
import type { ListParams } from "@/shared/types/listParams";

export const adminStaffKeys = {
  all: (kind: AdminStaffKind) => ["admin-staff", kind] as const,
  list: (kind: AdminStaffKind, params?: ListParams) =>
    ["admin-staff", kind, "list", params] as const,
  detail: (kind: AdminStaffKind, id: string) => ["admin-staff", kind, "detail", id] as const,
};
