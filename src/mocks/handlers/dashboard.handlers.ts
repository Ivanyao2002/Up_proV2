import { http, HttpResponse } from "msw";
import adminDashboard from "../data/dashboard-admin.json";
import driversList from "../data/drivers-list.json";
import zonesList from "../data/zones-list.json";

export const dashboardHandlers = [
  http.get("*/api/v2/admin/dashboard", () => {
    return HttpResponse.json(adminDashboard);
  }),

  http.get("*/api/v2/admin/drivers", () => {
    return HttpResponse.json(driversList);
  }),

  http.get("*/api/v2/admin/network/zones", () => {
    return HttpResponse.json(zonesList);
  }),
];
