import { http, HttpResponse } from "msw";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import kycQueue from "../data/kyc-queue.json";

export const fleetHandlers = [
  http.get("*/api/v2/admin/drivers/:id", ({ params }) => {
    const id = String(params.id);
    if (id === "103") {
      return HttpResponse.json(driverDetailPending);
    }
    return HttpResponse.json({ ...driverDetail, id: Number(id) || driverDetail.id });
  }),

  http.get("*/api/v2/admin/fleet/kyc", () => {
    return HttpResponse.json(kycQueue);
  }),

  http.post("*/api/v2/admin/drivers/:id/kyc/approve", () => {
    return HttpResponse.json({ ok: true, message: "KYC approuvé" });
  }),

  http.post("*/api/v2/admin/drivers/:id/kyc/reject", async ({ request }) => {
    const body = (await request.json()) as { reason?: string };
    return HttpResponse.json({
      ok: true,
      message: body.reason ?? "KYC rejeté",
    });
  }),
];
