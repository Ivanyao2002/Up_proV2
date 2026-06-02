import { http, HttpResponse } from "msw";
import tripsList from "../data/trips-list.json";
import tripDetail from "../data/trip-detail.json";
import liveMap from "../data/live-map.json";

export const opsHandlers = [
  http.get("*/api/v2/admin/ops/trips", () => {
    return HttpResponse.json(tripsList);
  }),

  http.get("*/api/v2/admin/ops/trips/:id", ({ params }) => {
    const id = String(params.id);
    const fromList = tripsList.data.find((t) => t.id === id);
    if (fromList) {
      return HttpResponse.json({
        ...tripDetail,
        ...fromList,
        id,
        timeline: tripDetail.timeline,
      });
    }
    return HttpResponse.json({ ...tripDetail, id });
  }),

  http.get("*/api/v2/admin/ops/map", () => {
    return HttpResponse.json(liveMap);
  }),
];
