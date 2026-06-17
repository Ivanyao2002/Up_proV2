import { LINKS } from "@/core/api/links";
import { apiClient } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { CashReconciliationRow } from "./compta.types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function mapCashReconciliation(row: unknown, index: number): CashReconciliationRow | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const id = String(rec.id ?? `cash-${index}`);
  const expected =
    Number(rec.expected_fcfa ?? rec.expected_amount_xof ?? rec.expected_xof ?? 0) || 0;
  const received =
    Number(rec.received_fcfa ?? rec.received_amount_xof ?? rec.declared_amount_xof ?? 0) || 0;
  const delta =
    Number(rec.delta_fcfa ?? rec.difference_xof ?? rec.delta_xof ?? received - expected) || 0;
  const statusRaw = String(rec.status ?? "pending").toLowerCase();
  const status: CashReconciliationRow["status"] =
    statusRaw === "matched" || statusRaw === "approved" || statusRaw === "validated"
      ? "matched"
      : statusRaw === "discrepancy" || statusRaw === "rejected"
        ? "discrepancy"
        : "pending";

  return {
    id,
    date_label:
      typeof rec.date_label === "string"
        ? rec.date_label
        : typeof rec.period_end === "string"
          ? rec.period_end
          : typeof rec.created_at === "string"
            ? rec.created_at.slice(0, 10)
            : id,
    driver_name:
      typeof rec.driver_name === "string"
        ? rec.driver_name
        : typeof rec.owner_name === "string"
          ? rec.owner_name
          : "—",
    franchise_name: typeof rec.franchise_name === "string" ? rec.franchise_name : undefined,
    expected_fcfa: expected,
    received_fcfa: received,
    delta_fcfa: delta,
    status,
  };
}

function extractCashRows(payload: unknown): CashReconciliationRow[] {
  const root = asRecord(payload);
  if (!root) return [];
  const candidates: unknown[] = [
    root.items,
    root.reconciliations,
    root.data,
    asRecord(root.data)?.items,
  ];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map((row, index) => mapCashReconciliation(row, index))
      .filter((row): row is CashReconciliationRow => row != null);
  }
  return [];
}

export const cashReconciliationsService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<CashReconciliationRow>> => {
    const response = await apiClient.get<unknown>(
      `${LINKS.admin.v1.accounting.cashReconciliations}${buildV1ListQuery(params)}`
    );
    const rows = extractCashRows(response);
    const root = asRecord(response);
    const pagination = asRecord(root?.pagination) ?? asRecord(asRecord(root?.data)?.pagination);
    if (pagination) {
      return {
        data: rows,
        meta: mapV1PaginationToMeta(
          {
            page: Number(pagination.page ?? 1),
            limit: Number(pagination.limit ?? params?.per_page ?? 25),
            total: Number(pagination.total ?? rows.length),
            totalPages: Number(pagination.totalPages ?? 1),
          },
          params
        ),
      };
    }
    return paginateClientList(rows, params);
  },
};
