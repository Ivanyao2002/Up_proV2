import { apiClient } from "@/core/http/apiClient";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  Paginated,
} from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type {
  ApiDriverRechargeBody,
  ApiDriverRechargeResponse,
  ApiDriverTransferListResponse,
  ApiDriverTransferStatsResponse,
} from "./driverRecharge.api.types";
import {
  extractDriverRechargeMessage,
  mapApiDriverTransferList,
  mapApiDriverTransferStats,
} from "./driverRecharge.mapper";

export interface DriverRechargePayload {
  driver_id: string;
  amount_fcfa: number;
  note?: string;
}

export interface DriverRechargeBatchPayload {
  driver_ids: string[];
  amount_fcfa: number;
  note?: string;
}

export interface DriverRechargeResult {
  ok: boolean;
  message: string;
  transfer?: PartnerDriverTransfer;
}

function toApiBody(payload: DriverRechargePayload): ApiDriverRechargeBody {
  return {
    driver_id: String(payload.driver_id).trim(),
    amount_fcfa: payload.amount_fcfa,
    note: payload.note?.trim() || undefined,
  };
}

export async function postDriverRechargeV1(
  url: string,
  payload: DriverRechargePayload
): Promise<DriverRechargeResult> {
  const response = await apiClient.post<ApiDriverRechargeResponse>(
    url,
    toApiBody(payload)
  );

  return {
    ok: response.ok !== false && response.status !== "error",
    message: extractDriverRechargeMessage(response),
    transfer: response.transfer
      ? {
          id: response.transfer.id,
          ref:
            response.transfer.ref?.trim() ||
            response.transfer.id.slice(0, 8).toUpperCase(),
          driver_id: response.transfer.driver_id ?? payload.driver_id,
          driver_name: response.transfer.driver_name ?? "—",
          driver_phone: response.transfer.driver_phone ?? "—",
          amount_fcfa:
            response.transfer.amount_fcfa ??
            response.transfer.amount_xof ??
            payload.amount_fcfa,
          status: "pending",
          mobile_wallet_credited: false,
          note: payload.note,
          created_at:
            response.transfer.created_at ?? new Date().toISOString(),
        }
      : undefined,
  };
}

export async function postDriverRechargeBatchV1(
  url: string,
  batch: DriverRechargeBatchPayload
): Promise<DriverRechargeResult> {
  const ids = batch.driver_ids.filter(Boolean);
  if (!ids.length) {
    return { ok: false, message: "Sélectionnez au moins un chauffeur." };
  }

  let last: DriverRechargeResult | undefined;
  for (const driver_id of ids) {
    last = await postDriverRechargeV1(url, {
      driver_id,
      amount_fcfa: batch.amount_fcfa,
      note: batch.note,
    });
  }

  const count = ids.length;
  return {
    ok: true,
    message:
      count === 1 && last?.message
        ? last.message
        : `${count} recharge(s) de ${batch.amount_fcfa.toLocaleString("fr-FR")} FCFA envoyée(s).`,
    transfer: last?.transfer,
  };
}

export async function fetchDriverTransferStatsV1(
  url: string
): Promise<PartnerDriverRechargeStats> {
  const response = await apiClient.get<ApiDriverTransferStatsResponse>(url);
  return mapApiDriverTransferStats(response);
}

export async function fetchDriverTransferListV1(
  url: string,
  params?: ListParams
): Promise<Paginated<PartnerDriverTransfer>> {
  const response = await apiClient.get<ApiDriverTransferListResponse>(
    `${url}${buildV1ListQuery(params)}`
  );
  return mapApiDriverTransferList(response, params);
}
