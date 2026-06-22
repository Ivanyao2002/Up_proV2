import { mapAccountantItem } from "./adminAccountants.mapper";
import { mapAccountantsList } from "./adminAccountants.mapper";
import type { AdminStaffKind } from "./adminStaff.config";
import { getAdminStaffConfig } from "./adminStaff.config";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type { StaffListItem } from "./adminStaff.types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function extractItems(payload: unknown, arrayKeys: string[]): unknown[] {
  const root = asRecord(payload);
  if (!root) return [];
  for (const key of arrayKeys) {
    const candidate = root[key];
    if (Array.isArray(candidate)) return candidate;
  }
  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.data)) return root.data;
  return [];
}

export function mapStaffList(
  kind: AdminStaffKind,
  payload: unknown,
  params?: ListParams
): Paginated<StaffListItem> {
  const config = getAdminStaffConfig(kind);
  const items = extractItems(payload, config.listArrayKeys)
    .map((row, index) => mapAccountantItem(row, index))
    .filter((row): row is StaffListItem => row != null);

  const root = asRecord(payload);
  const pagination = asRecord(root?.pagination);
  if (pagination) {
    return mapAccountantsList({ items, pagination }, params);
  }

  return mapAccountantsList({ [config.listArrayKeys[0]]: items }, params);
}
