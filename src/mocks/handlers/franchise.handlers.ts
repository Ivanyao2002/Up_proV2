import { http, HttpResponse } from "msw";
import dashboardFranchise from "../data/dashboard-franchise.json";
import subPartners from "../data/sub-partners-franchise.json";
import driversListFranchise from "../data/drivers-list-franchise.json";
import financeFranchise from "../data/finance-franchise.json";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";

export const franchiseHandlers = [
  http.get("*/api/v2/franchise/dashboard", () => {
    return HttpResponse.json(dashboardFranchise);
  }),

  http.get("*/api/v2/franchise/partners", () => {
    return HttpResponse.json(subPartners);
  }),

  http.get("*/api/v2/franchise/partners/:id", ({ params }) => {
    const id = Number(params.id);
    const partner = subPartners.data.find((p) => p.id === id) ?? subPartners.data[0];
    return HttpResponse.json({
      ...partner,
      franchise_name: "Abidjan Sud",
      legal_name: `${partner.name} SARL`,
      address: "Abidjan",
      created_at: "2023-01-15T00:00:00Z",
      vehicles_count: Math.floor(partner.drivers_count * 0.8),
    });
  }),

  http.get("*/api/v2/franchise/drivers", () => {
    return HttpResponse.json(driversListFranchise);
  }),

  http.get("*/api/v2/franchise/drivers/:id", ({ params }) => {
    const id = String(params.id);
    if (id === "103") {
      return HttpResponse.json(driverDetailPending);
    }
    return HttpResponse.json({ ...driverDetail, id: Number(id) || 101 });
  }),

  http.get("*/api/v2/franchise/finance", () => {
    return HttpResponse.json(financeFranchise);
  }),
];
