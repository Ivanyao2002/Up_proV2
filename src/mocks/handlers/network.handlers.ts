import { http, HttpResponse } from "msw";
import franchisesList from "../data/franchises-list.json";
import franchiseDetail from "../data/franchise-detail.json";
import partnersList from "../data/partners-list.json";
import partnerDetail from "../data/partner-detail.json";
import zonesList from "../data/zones-list.json";
import zoneDetail from "../data/zone-detail.json";

export const networkHandlers = [
  http.get("*/api/v2/admin/network/franchises", () => {
    return HttpResponse.json(franchisesList);
  }),

  http.get("*/api/v2/admin/network/franchises/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = franchisesList.data.find((f) => f.id === id);
    return HttpResponse.json({
      ...franchiseDetail,
      ...fromList,
      id: id || franchiseDetail.id,
    });
  }),

  http.get("*/api/v2/admin/network/partners", () => {
    return HttpResponse.json(partnersList);
  }),

  http.get("*/api/v2/admin/network/partners/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = partnersList.data.find((p) => p.id === id);
    return HttpResponse.json({
      ...partnerDetail,
      ...fromList,
      id: id || partnerDetail.id,
    });
  }),

  http.get("*/api/v2/admin/network/zones/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = zonesList.data.find((z) => z.id === id);
    return HttpResponse.json({
      ...zoneDetail,
      ...fromList,
      id: id || zoneDetail.id,
    });
  }),
];
