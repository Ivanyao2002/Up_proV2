import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { PricingCountryCode } from "./pricingConfig.api.types";
import type {
  AdminHoliday,
  CreateHolidayPayload,
  HolidayResponse,
  HolidaysListResponse,
  PatchHolidayPayload,
} from "./holidays.api.types";

function withCountryQuery(countryCode?: PricingCountryCode): string {
  if (!countryCode) return LINKS.admin.v1.holidays;
  return `${LINKS.admin.v1.holidays}?countryCode=${countryCode}`;
}

function unwrapList(response: HolidaysListResponse | AdminHoliday[]): AdminHoliday[] {
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

function unwrapOne(response: HolidayResponse | AdminHoliday): AdminHoliday {
  if ("data" in response && response.data) return response.data;
  return response as AdminHoliday;
}

export const holidaysService = {
  list: async (countryCode?: PricingCountryCode) => {
    const response = await apiClient.get<HolidaysListResponse | AdminHoliday[]>(
      withCountryQuery(countryCode)
    );
    return unwrapList(response);
  },

  create: (payload: CreateHolidayPayload) =>
    apiClient.post<HolidayResponse | AdminHoliday>(LINKS.admin.v1.holidays, payload).then(unwrapOne),

  patch: (id: string, payload: PatchHolidayPayload) =>
    apiClient
      .patch<HolidayResponse | AdminHoliday>(LINKS.admin.v1.holidayById(id), payload)
      .then(unwrapOne),

  deactivate: (id: string) =>
    apiClient.delete<HolidayResponse | AdminHoliday>(LINKS.admin.v1.holidayById(id)).then(unwrapOne),
};
