import type { PricingCountryCode } from "./pricingConfig.api.types";

export interface AdminHoliday {
  id: string;
  countryCode: PricingCountryCode;
  date: string;
  label: string;
  coefficient: number;
  active: boolean;
}

export interface CreateHolidayPayload {
  countryCode: PricingCountryCode;
  date: string;
  label: string;
  coefficient: number;
}

export interface PatchHolidayPayload {
  countryCode?: PricingCountryCode;
  date?: string;
  label?: string;
  coefficient?: number;
  active?: boolean;
}

export interface HolidaysListResponse {
  status?: string;
  data: AdminHoliday[];
}

export interface HolidayResponse {
  status?: string;
  data: AdminHoliday;
}
