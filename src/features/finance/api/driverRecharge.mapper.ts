import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  PartnerDriverTransferStatus,
  Paginated,
} from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type {
  ApiDriverRechargeResponse,
  ApiDriverTransferItem,
  ApiDriverTransferListResponse,
  ApiDriverTransferStatsResponse,
} from "./driverRecharge.api.types";

function mapTransferStatus(status?: string | null): PartnerDriverTransferStatus {
  const key = String(status ?? "").toLowerCase();
  if (key === "completed" || key === "posted" || key === "success") {
    return "completed";
  }
  if (key === "failed" || key === "error" || key === "rejected") {
    return "failed";
  }
  return "pending";
}

export function mapApiDriverTransferItem(
  item: ApiDriverTransferItem
): PartnerDriverTransfer {
  const status = mapTransferStatus(item.status);
  return {
    id: item.id,
    ref: item.ref?.trim() || item.id.slice(0, 8).toUpperCase(),
    driver_id: item.driver_id ?? "",
    driver_name: item.driver_name?.trim() || "—",
    driver_phone: item.driver_phone?.trim() || "—",
    amount_fcfa: item.amount_fcfa ?? item.amount_xof ?? 0,
    status,
    mobile_wallet_credited:
      item.mobile_wallet_credited ?? status === "completed",
    note: item.note?.trim() || undefined,
    created_at: item.created_at ?? new Date().toISOString(),
  };
}

export function mapApiDriverTransferStats(
  response: ApiDriverTransferStatsResponse
): PartnerDriverRechargeStats {
  const total =
    response.total_spent_fcfa ??
    response.totalAmountXof ??
    0;
  const count =
    response.transfers_count ??
    response.totalTransfers ??
    0;

  return {
    total_spent_fcfa: total,
    transfers_count: count,
    month_spent_fcfa: response.month_spent_fcfa ?? total,
    month_transfers_count: response.month_transfers_count ?? count,
    last_transfer_at: response.last_transfer_at ?? undefined,
  };
}

export function mapApiDriverTransferList(
  response: ApiDriverTransferListResponse,
  params?: ListParams
): Paginated<PartnerDriverTransfer> {
  const items = (response.items ?? response.transfers ?? []).map(
    mapApiDriverTransferItem
  );
  const meta = mapV1PaginationToMeta(response.pagination, params);

  return { data: items, meta };
}

export function extractDriverRechargeMessage(
  response: ApiDriverRechargeResponse
): string {
  if (response.message?.trim()) return response.message.trim();
  if (response.transfer?.driver_name) {
    const amount =
      response.transfer.amount_fcfa ?? response.transfer.amount_xof ?? 0;
    return `Recharge de ${amount.toLocaleString("fr-FR")} FCFA envoyée à ${response.transfer.driver_name}`;
  }
  return "Recharge effectuée";
}
