import type { ApiDispatchLogItem } from "./dispatchLogs.api.types";
import {
  formatDispatchLogCode,
  isDispatchExclusionLog,
} from "../lib/dispatchLog.labels";

export interface DispatchLogEntry {
  id: string;
  at: string;
  code: string;
  label: string;
  message: string;
  driverId?: string;
  isExclusion: boolean;
  rawDetails?: string;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readDetails(item: ApiDispatchLogItem): string | undefined {
  const direct =
    readString(item.detail) ??
    readString(item.message) ??
    readString(item.action) ??
    readString(item.event_type) ??
    readString(item.eventType);

  if (direct) return direct;

  const meta = item.metadata ?? item.payload ?? item.details;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  if (meta && typeof meta === "object") {
    try {
      return JSON.stringify(meta);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function mapLogItem(item: ApiDispatchLogItem, index: number): DispatchLogEntry {
  const code =
    readString(item.code) ??
    readString(item.event_type) ??
    readString(item.eventType) ??
    readString(item.action) ??
    "DISPATCH_EVENT";

  const at =
    readString(item.created_at) ??
    readString(item.createdAt) ??
    readString(item.recorded_at) ??
    readString(item.recordedAt) ??
    new Date().toISOString();

  const message = readDetails(item) ?? formatDispatchLogCode(code);

  return {
    id: readString(item.id) ?? `${code}-${index}`,
    at,
    code,
    label: formatDispatchLogCode(code),
    message,
    driverId:
      readString(item.driver_id) ?? readString(item.driverId) ?? undefined,
    isExclusion: isDispatchExclusionLog(code),
    rawDetails: readDetails(item),
  };
}

export function mapApiDispatchLogsResponse(
  response: { logs?: ApiDispatchLogItem[]; items?: ApiDispatchLogItem[]; data?: ApiDispatchLogItem[] }
): DispatchLogEntry[] {
  const items = response.logs ?? response.items ?? response.data ?? [];
  return items
    .map(mapLogItem)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
