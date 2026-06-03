import { http, HttpResponse } from "msw";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import kycQueue from "../data/kyc-queue.json";
import fleetClientsList from "../data/fleet-clients-list.json";
import fleetClientDetail from "../data/fleet-client-detail.json";
import driverTripsSeed from "../data/driver-trips.json";
import driverWalletTxSeed from "../data/driver-wallet-transactions.json";
import type { DriverDetail, Paginated, TripStatus } from "@/shared/types";

const accountOverrides: Record<string, DriverDetail["account_status"]> = {};
const clientStatusOverrides: Record<number, "active" | "suspended"> = {};

type DriverTripRow = {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
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

function getDriver(id: string): DriverDetail {
  const base =
    id === "103"
      ? ({ ...driverDetailPending, id: 103 } as unknown as DriverDetail)
      : ({ ...driverDetail, id: Number(id) || driverDetail.id } as DriverDetail);
  if (accountOverrides[id]) {
    return { ...base, account_status: accountOverrides[id] };
  }
  return base;
}

export const fleetHandlers = [
  http.get("*/api/v2/admin/drivers/:id", ({ params }) => {
    return HttpResponse.json(getDriver(String(params.id)));
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

  http.post("*/api/v2/admin/drivers/:id/suspend", ({ params }) => {
    const id = String(params.id);
    accountOverrides[id] = "suspended";
    return HttpResponse.json({
      ok: true,
      message: "Chauffeur suspendu",
      driver: getDriver(id),
    });
  }),

  http.post("*/api/v2/admin/drivers/:id/activate", ({ params }) => {
    const id = String(params.id);
    accountOverrides[id] = "approved";
    return HttpResponse.json({
      ok: true,
      message: "Chauffeur réactivé",
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

  http.get("*/api/v2/admin/fleet/clients", () => {
    return HttpResponse.json(fleetClientsList);
  }),

  http.get("*/api/v2/admin/fleet/clients/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = fleetClientsList.data.find((c) => c.id === id);
    const status =
      clientStatusOverrides[id] ?? fromList?.status ?? fleetClientDetail.status;
    return HttpResponse.json({
      ...fleetClientDetail,
      ...fromList,
      id: id || fleetClientDetail.id,
      status,
    });
  }),

  http.post("*/api/v2/admin/fleet/clients/:id/suspend", ({ params }) => {
    const id = Number(params.id);
    clientStatusOverrides[id] = "suspended";
    const fromList = fleetClientsList.data.find((c) => c.id === id);
    return HttpResponse.json({
      ok: true,
      message: "Client suspendu",
      client: {
        ...fleetClientDetail,
        ...fromList,
        id,
        status: "suspended" as const,
      },
    });
  }),

  http.post("*/api/v2/admin/fleet/clients/:id/activate", ({ params }) => {
    const id = Number(params.id);
    clientStatusOverrides[id] = "active";
    const fromList = fleetClientsList.data.find((c) => c.id === id);
    return HttpResponse.json({
      ok: true,
      message: "Client réactivé",
      client: {
        ...fleetClientDetail,
        ...fromList,
        id,
        status: "active" as const,
      },
    });
  }),
];
