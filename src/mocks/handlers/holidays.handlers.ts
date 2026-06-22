import { http, HttpResponse } from "msw";
import type { PricingCountryCode } from "@/features/settings/api/pricingConfig.api.types";
import type { AdminHoliday } from "@/features/settings/api/holidays.api.types";

let holidayState: AdminHoliday[] = [
  {
    id: "h-1",
    countryCode: "CI",
    date: "2026-01-01",
    label: "Jour de l'An",
    coefficient: 1.25,
    active: true,
  },
  {
    id: "h-2",
    countryCode: "CI",
    date: "2026-05-01",
    label: "Fête du Travail",
    coefficient: 1.2,
    active: true,
  },
  {
    id: "h-3",
    countryCode: "CI",
    date: "2026-08-07",
    label: "Fête Nationale",
    coefficient: 1.3,
    active: true,
  },
  {
    id: "h-4",
    countryCode: "CI",
    date: "2026-08-15",
    label: "Assomption",
    coefficient: 1.2,
    active: true,
  },
  {
    id: "h-5",
    countryCode: "CI",
    date: "2026-11-01",
    label: "Toussaint",
    coefficient: 1.2,
    active: true,
  },
  {
    id: "h-6",
    countryCode: "CI",
    date: "2026-12-25",
    label: "Noël",
    coefficient: 1.3,
    active: true,
  },
];

let nextHolidayId = 7;

function filterByCountry(countryCode: string | null) {
  if (!countryCode) return holidayState.filter((h) => h.active);
  return holidayState.filter((h) => h.countryCode === countryCode && h.active);
}

export const holidaysHandlers = [
  http.get("*/v1/admin/holidays", ({ request }) => {
    const url = new URL(request.url);
    const countryCode = url.searchParams.get("countryCode");
    return HttpResponse.json({ status: "ok", data: filterByCountry(countryCode) });
  }),

  http.post("*/v1/admin/holidays", async ({ request }) => {
    const body = (await request.json()) as {
      countryCode: PricingCountryCode;
      date: string;
      label: string;
      coefficient: number;
    };
    const created: AdminHoliday = {
      id: `h-${nextHolidayId++}`,
      countryCode: body.countryCode,
      date: body.date,
      label: body.label,
      coefficient: body.coefficient,
      active: true,
    };
    holidayState = [...holidayState, created];
    return HttpResponse.json({ status: "ok", data: created });
  }),

  http.patch("*/v1/admin/holidays/:id", async ({ params, request }) => {
    const id = String(params.id);
    const patch = (await request.json()) as Partial<AdminHoliday>;
    const index = holidayState.findIndex((h) => h.id === id);
    if (index < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    holidayState[index] = { ...holidayState[index], ...patch };
    return HttpResponse.json({ status: "ok", data: holidayState[index] });
  }),

  http.delete("*/v1/admin/holidays/:id", ({ params }) => {
    const id = String(params.id);
    const index = holidayState.findIndex((h) => h.id === id);
    if (index < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    holidayState[index] = { ...holidayState[index], active: false };
    return HttpResponse.json({ status: "ok", data: holidayState[index] });
  }),
];
