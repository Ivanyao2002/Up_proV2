import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS } from "@/core/api/links";
import {
  isValidBonusWeekStartDow,
  type BonusWeekStartDow,
} from "../lib/bonusWeekStart.labels";
import type { ApiV1DriverDetailResponse } from "./driverDetail.v1.api.types";

export interface DriverBonusSettings {
  weekStartDow: BonusWeekStartDow;
}

function parseWeekStartDow(raw: unknown): BonusWeekStartDow | null {
  if (typeof raw === "number" && isValidBonusWeekStartDow(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number.parseInt(raw, 10);
    if (isValidBonusWeekStartDow(parsed)) return parsed;
  }
  return null;
}

function mapSettingsResponse(data: unknown): DriverBonusSettings | null {
  if (!data || typeof data !== "object") return null;

  const root = data as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root.settings && typeof root.settings === "object"
        ? (root.settings as Record<string, unknown>)
        : root;

  const driverRecord =
    nested.driver && typeof nested.driver === "object"
      ? (nested.driver as Record<string, unknown>)
      : root.driver && typeof root.driver === "object"
        ? (root.driver as Record<string, unknown>)
        : null;

  const weekStartDow = parseWeekStartDow(
    nested.weekStartDow ??
      nested.week_start_dow ??
      root.weekStartDow ??
      root.week_start_dow ??
      driverRecord?.bonusWeekStartDow ??
      driverRecord?.bonus_week_start_dow
  );

  return weekStartDow === null ? null : { weekStartDow };
}

function readWeekStartFromDriverDetail(
  response: ApiV1DriverDetailResponse
): DriverBonusSettings | null {
  const weekStartDow = parseWeekStartDow(
    response.driver.bonusWeekStartDow ?? response.driver.bonus_week_start_dow
  );
  return weekStartDow === null ? null : { weekStartDow };
}

export const driverBonusSettingsService = {
  get: async (driverId: string): Promise<DriverBonusSettings | null> => {
    try {
      const response = await apiClient.get<unknown>(
        LINKS.admin.v1.driverBonusSettings(driverId)
      );
      return mapSettingsResponse(response);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 405)
      ) {
        const detail = await apiClient.get<ApiV1DriverDetailResponse>(
          LINKS.admin.v1.driverById(driverId)
        );
        return readWeekStartFromDriverDetail(detail);
      }
      throw error;
    }
  },

  update: async (
    driverId: string,
    weekStartDow: BonusWeekStartDow
  ): Promise<DriverBonusSettings> => {
    const response = await apiClient.put<unknown>(
      LINKS.admin.v1.driverBonusSettings(driverId),
      { weekStartDow }
    );
    return (
      mapSettingsResponse(response) ?? {
        weekStartDow,
      }
    );
  },
};
