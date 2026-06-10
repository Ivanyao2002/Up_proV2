import { http, HttpResponse } from "msw";
import driverDetail from "../data/driver-detail.json";
import driverDetail102 from "../data/driver-detail-102.json";
import driverDetail104 from "../data/driver-detail-104.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import kycQueue from "../data/kyc-queue.json";

import {
  activateFleetClient,
  getFleetClientDetail,
  listFleetClients,
  suspendFleetClient,
} from "../lib/fleetClientsMock";
import driverTripsSeed from "../data/driver-trips.json";
import driverWalletTxSeed from "../data/driver-wallet-transactions.json";
import type {
  Driver,
  DriverDetail,
  Paginated,
  TripMatchingOutcome,
  TripStatus,
} from "@/shared/types";
import {
  applyDriverAdminOverrides,
  driverAccountStatusOverrides,
  driverAvailabilityOverrides,
} from "../lib/driverAdminOverrides";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";

type DriverTripRow = {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
  offer_outcome?: TripMatchingOutcome;
};

type WalletTxRow = {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount_fcfa: number;
  balance_after_fcfa: number;
  created_at: string;
};

const driverTripsState = driverTripsSeed as Record<
  string,
  Paginated<DriverTripRow>
>;
const driverWalletState = driverWalletTxSeed as Record<
  string,
  Paginated<WalletTxRow>
>;

const DRIVER_DETAILS: Record<string, DriverDetail> = {
  "101": driverDetail as DriverDetail,
  "102": driverDetail102 as DriverDetail,
  "104": driverDetail104 as DriverDetail,
  "103": driverDetailPending as unknown as DriverDetail,
};

function getDriver(id: string): DriverDetail {
  const base =
    DRIVER_DETAILS[id] ??
    ({ ...driverDetail, id: Number(id) || driverDetail.id } as DriverDetail);
  return applyDriverAdminOverrides(base as Driver) as DriverDetail;
}

export const fleetHandlers = [
  http.get("*/api/v2/admin/drivers/:id", ({ params }) => {
    return HttpResponse.json(getDriver(String(params.id)));
  }),

  http.get("*/api/v2/admin/fleet/kyc", ({ request }) => {
    const query = parseListQuery(request);
    const list = kycQueue.data.filter((row) =>
      matchesSearch(
        query.search,
        row.first_name,
        row.last_name,
        row.phone,
        row.zone,
        row.owner_name
      )
    );
    return HttpResponse.json(paginatedList(list, query));
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

  http.post("*/api/v2/admin/drivers/:id/suspend", ({ params }) => {
    const id = String(params.id);
    driverAccountStatusOverrides[id] = "suspended";
    driverAvailabilityOverrides[id] = "offline";
    return HttpResponse.json({
      ok: true,
      message: "Chauffeur suspendu",
      driver: getDriver(id),
    });
  }),

  http.post("*/api/v2/admin/drivers/:id/activate", ({ params }) => {
    const id = String(params.id);
    driverAccountStatusOverrides[id] = "approved";
    return HttpResponse.json({
      ok: true,
      message: "Chauffeur réactivé",
      driver: getDriver(id),
    });
  }),

  http.post("*/api/v2/admin/drivers/:id/set-availability", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { availability?: DriverDetail["availability"] };
    const availability = body.availability ?? "offline";
    driverAvailabilityOverrides[id] = availability;
    return HttpResponse.json({
      ok: true,
      message:
        availability === "online"
          ? "Chauffeur mis en ligne"
          : "Chauffeur mis hors ligne",
      driver: getDriver(id),
    });
  }),

  http.get("*/api/v2/admin/drivers/:id/trips", ({ params }) => {
    const id = String(params.id);
    const payload = driverTripsState[id] ?? {
      data: [],
      meta: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
    };
    return HttpResponse.json(payload);
  }),

  http.get("*/api/v2/admin/drivers/:id/wallet/transactions", ({ params }) => {
    const id = String(params.id);
    const payload = driverWalletState[id] ?? {
      data: [],
      meta: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
    };
    return HttpResponse.json(payload);
  }),

  http.get("*/api/v2/admin/fleet/clients", ({ request }) => {
    return HttpResponse.json(listFleetClients(request));
  }),

  http.get("*/api/v2/admin/fleet/clients/:id", ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json(getFleetClientDetail(id));
  }),

  http.post("*/api/v2/admin/fleet/clients/:id/suspend", ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json(suspendFleetClient(id));
  }),

  http.post("*/api/v2/admin/fleet/clients/:id/activate", ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json(activateFleetClient(id));
  }),
];
