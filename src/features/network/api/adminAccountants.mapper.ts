import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { AccountantListItem } from "./adminAccountants.types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function mapCountry(value: unknown): AccountantListItem["country"] {
  const rec = asRecord(value);
  if (!rec) return undefined;
  const id = rec.id != null ? String(rec.id) : "";
  const code = typeof rec.code === "string" ? rec.code : "";
  const name = typeof rec.name === "string" ? rec.name : code;
  if (!id && !code) return undefined;
  return { id, code, name };
}

export function mapAccountantItem(row: unknown, index: number): AccountantListItem | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const userId = String(rec.userId ?? rec.user_id ?? rec.id ?? `accountant-${index}`);
  const firstName = typeof rec.firstName === "string" ? rec.firstName : undefined;
  const lastName = typeof rec.lastName === "string" ? rec.lastName : undefined;
  const displayName =
    typeof rec.displayName === "string"
      ? rec.displayName
      : [firstName, lastName].filter(Boolean).join(" ") ||
        (typeof rec.email === "string" ? rec.email : userId);

  return {
    userId,
    email: typeof rec.email === "string" ? rec.email : "—",
    phone: typeof rec.phone === "string" ? rec.phone : undefined,
    firstName,
    lastName,
    displayName,
    status: typeof rec.status === "string" ? rec.status : "active",
    active: typeof rec.active === "boolean" ? rec.active : undefined,
    createdAt: typeof rec.createdAt === "string" ? rec.createdAt : undefined,
    country: mapCountry(rec.country),
  };
}

export function mapAccountantsList(
  payload: unknown,
  params?: ListParams
): Paginated<AccountantListItem> {
  const root = asRecord(payload);
  const items = (
    (Array.isArray(root?.items) ? root.items : null) ??
    (Array.isArray(root?.accountants) ? root.accountants : null) ??
    []
  )
    .map((row, index) => mapAccountantItem(row, index))
    .filter((row): row is AccountantListItem => row != null);

  const pagination = asRecord(root?.pagination);
  if (pagination) {
    return {
      data: items,
      meta: mapV1PaginationToMeta(
        {
          page: Number(pagination.page ?? 1),
          limit: Number(pagination.limit ?? params?.per_page ?? 25),
          total: Number(pagination.total ?? items.length),
          totalPages: Number(pagination.totalPages ?? 1),
        },
        params
      ),
    };
  }

  return paginateClientList(items, params);
}
