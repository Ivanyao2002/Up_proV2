import { http, HttpResponse } from "msw";
import dashboardFranchise from "../data/dashboard-franchise.json";
import subPartners from "../data/sub-partners-franchise.json";
import driversListFranchiseSeed from "../data/drivers-list-franchise.json";
import financeFranchise from "../data/finance-franchise.json";
import driverTransfersFranchiseSeed from "../data/driver-wallet-transfers-franchise.json";
import territoryFranchise from "../data/territory-franchise.json";
import franchisePromos from "../data/franchise-promos.json";
import franchiseSupport from "../data/franchise-support-tickets.json";
import franchiseKycQueueSeed from "../data/franchise-kyc-queue.json";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import { buildAdminLiveMap } from "../lib/liveMapBuilder";
import type {
  Driver,
  DriverDetail,
  KycQueueItem,
  PartnerDriverTransfer,
  PartnerDriverRechargeStats,
} from "@/shared/types";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";
import { filterDrivers, DRIVERS_CATALOG } from "../lib/driversCatalog";

type DriversList = { data: Driver[]; meta: typeof driversListFranchiseSeed.meta };
type KycQueue = { data: KycQueueItem[]; meta: typeof franchiseKycQueueSeed.meta };

const FRANCHISE_DRIVER_IDS = new Set(
  (driversListFranchiseSeed.data as Driver[]).map((d) => d.id)
);
const FRANCHISE_DRIVERS = DRIVERS_CATALOG.filter((d) => FRANCHISE_DRIVER_IDS.has(d.id));

let driversState: DriversList = {
  data: FRANCHISE_DRIVERS,
  meta: driversListFranchiseSeed.meta,
};

let kycQueueState: KycQueue = {
  data: franchiseKycQueueSeed.data as KycQueueItem[],
  meta: franchiseKycQueueSeed.meta,
};

type FranchiseFinance = typeof financeFranchise;
let financeState: FranchiseFinance = structuredClone(financeFranchise);

const franchiseTransfersSeed = driverTransfersFranchiseSeed as {
  stats: PartnerDriverRechargeStats;
  data: PartnerDriverTransfer[];
};

let franchiseDriverTransfers: PartnerDriverTransfer[] = [
  ...franchiseTransfersSeed.data,
];
let franchiseRechargeStats: PartnerDriverRechargeStats = {
  ...franchiseTransfersSeed.stats,
};

function franchiseAvailableFcfa() {
  return Math.max(
    0,
    financeState.balance_fcfa - Math.floor(financeState.payouts_pending_fcfa * 0.2)
  );
}

const driverDetails: Record<string, DriverDetail> = {
  "101": { ...(driverDetail as DriverDetail), id: 101 },
  "103": { ...(driverDetailPending as unknown as DriverDetail), id: 103 },
  "110": {
    ...(driverDetail as DriverDetail),
    id: 110,
    first_name: "Traoré",
    last_name: "Aminata",
    account_status: "approved",
  },
  "112": {
    ...(driverDetailPending as unknown as DriverDetail),
    id: 112,
    first_name: "Koné",
    last_name: "Aminata",
    zone: "Cocody",
    owner_name: "Cocody Express",
  },
};

function getDriverDetail(id: string): DriverDetail {
  const base = driverDetails[id] ?? { ...driverDetail, id: Number(id) || 101 };
  const fromList = driversState.data.find((d) => String(d.id) === id);
  if (fromList) {
    return {
      ...base,
      ...fromList,
      first_name: fromList.first_name,
      last_name: fromList.last_name,
      account_status: fromList.account_status,
      availability: fromList.availability,
    };
  }
  return base;
}

function setDriverDetail(id: string, detail: DriverDetail) {
  driverDetails[id] = detail;
  const idx = driversState.data.findIndex((d) => String(d.id) === id);
  if (idx >= 0) {
    const next = [...driversState.data];
    next[idx] = {
      ...next[idx],
      account_status: detail.account_status,
      availability: detail.availability,
      first_name: detail.first_name,
      last_name: detail.last_name,
    };
    driversState.data = next;
  }
}

function removeFromKycQueue(driverId: number) {
  const data = kycQueueState.data.filter((q) => q.driver_id !== driverId);
  kycQueueState.data = data;
  kycQueueState.meta.total = data.length;
}

export const franchiseHandlers = [
  http.get("*/api/v2/franchise/dashboard", () => {
    return HttpResponse.json({
      ...dashboardFranchise,
      pending_kyc: kycQueueState.meta.total,
    });
  }),

  http.get("*/api/v2/franchise/ops/map", () => {
    return HttpResponse.json(buildAdminLiveMap({ franchise_id: "1" }));
  }),

  http.get("*/api/v2/franchise/territory", () => {
    return HttpResponse.json(territoryFranchise);
  }),

  http.get("*/api/v2/franchise/partners", ({ request }) => {
    const query = parseListQuery(request);
    let list = subPartners.data.filter((p) =>
      matchesSearch(query.search, p.name, p.city, p.contact_email)
    );
    if (query.status) list = list.filter((p) => p.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/partners/:id", ({ params }) => {
    const id = Number(params.id);
    const partner = subPartners.data.find((p) => p.id === id) ?? subPartners.data[0];
    return HttpResponse.json({
      ...partner,
      franchise_name: territoryFranchise.franchise_name,
      legal_name: `${partner.name} SARL`,
      address: partner.city,
      created_at: "2023-01-15T00:00:00Z",
      vehicles_count: Math.floor(partner.drivers_count * 0.8),
    });
  }),

  http.get("*/api/v2/franchise/drivers", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterDrivers(driversState.data, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/franchise/drivers/kyc-queue", ({ request }) => {
    const query = parseListQuery(request);
    const list = kycQueueState.data.filter((row) =>
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

  http.get("*/api/v2/franchise/drivers/:id", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json(getDriverDetail(id));
  }),

  http.post("*/api/v2/franchise/drivers/:id/kyc/approve", ({ params }) => {
    const id = String(params.id);
    const detail = getDriverDetail(id);
    const now = new Date().toISOString();
    const updated: DriverDetail = {
      ...detail,
      account_status: "approved",
      approved_at: now,
      kyc_documents: detail.kyc_documents.map((doc) => ({
        ...doc,
        status: "approved" as const,
        reviewed_at: now,
        status_note: undefined,
      })),
      timeline: [
        {
          id: "approved-now",
          type: "approved",
          label: "Compte approuvé",
          description: `Validation franchise ${territoryFranchise.franchise_name}`,
          at: now,
        },
        ...detail.timeline,
      ],
    };
    setDriverDetail(id, updated);
    removeFromKycQueue(Number(id));
    return HttpResponse.json({ ok: true, message: "Chauffeur approuvé", driver: updated });
  }),

  http.post("*/api/v2/franchise/drivers/:id/kyc/reject", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { reason?: string };
    const detail = getDriverDetail(id);
    const now = new Date().toISOString();
    const updated: DriverDetail = {
      ...detail,
      account_status: "suspended",
      kyc_documents: detail.kyc_documents.map((doc) =>
        doc.status === "pending"
          ? {
              ...doc,
              status: "rejected" as const,
              reviewed_at: now,
              status_note: body.reason ?? "Documents non conformes",
            }
          : doc
      ),
    };
    setDriverDetail(id, updated);
    removeFromKycQueue(Number(id));
    return HttpResponse.json({ ok: true, message: "Demande rejetée", driver: updated });
  }),

  http.post(
    "*/api/v2/franchise/drivers/:id/documents/:docId/approve",
    ({ params }) => {
      const id = String(params.id);
      const docId = String(params.docId);
      const detail = getDriverDetail(id);
      const now = new Date().toISOString();
      const docs = detail.kyc_documents.map((doc) =>
        doc.id === docId
          ? { ...doc, status: "approved" as const, reviewed_at: now, status_note: undefined }
          : doc
      );
      const allApproved = docs.every(
        (d) => d.status === "approved" || !d.uploaded_at
      );
      const updated: DriverDetail = {
        ...detail,
        kyc_documents: docs,
        account_status: allApproved ? "approved" : detail.account_status,
        approved_at: allApproved ? now : detail.approved_at,
      };
      if (allApproved) {
        removeFromKycQueue(Number(id));
      }
      setDriverDetail(id, updated);
      return HttpResponse.json({ ok: true, driver: updated });
    }
  ),

  http.post(
    "*/api/v2/franchise/drivers/:id/documents/:docId/reject",
    async ({ params, request }) => {
      const id = String(params.id);
      const docId = String(params.docId);
      const body = (await request.json()) as { reason?: string };
      const detail = getDriverDetail(id);
      const now = new Date().toISOString();
      const docs = detail.kyc_documents.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: "rejected" as const,
              reviewed_at: now,
              status_note: body.reason ?? "Document illisible",
            }
          : doc
      );
      const updated: DriverDetail = { ...detail, kyc_documents: docs };
      setDriverDetail(id, updated);
      return HttpResponse.json({ ok: true, driver: updated });
    }
  ),

  http.get("*/api/v2/franchise/finance", () => {
    return HttpResponse.json({
      ...financeState,
      available_fcfa: franchiseAvailableFcfa(),
    });
  }),

  http.get("*/api/v2/franchise/finance/driver-transfers/stats", () => {
    return HttpResponse.json(franchiseRechargeStats);
  }),

  http.get("*/api/v2/franchise/finance/driver-transfers", ({ request }) => {
    const query = parseListQuery(request);
    const list = franchiseDriverTransfers.filter((t) =>
      matchesSearch(
        query.search,
        t.ref,
        t.driver_name,
        t.driver_phone,
        t.note ?? ""
      )
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.post("*/api/v2/franchise/finance/driver-recharge", async ({ request }) => {
    const body = (await request.json()) as {
      driver_id?: number;
      amount_fcfa?: number;
      note?: string;
    };
    const driverId = body.driver_id ?? 0;
    const amount = body.amount_fcfa ?? 0;
    const available = franchiseAvailableFcfa();

    if (amount < 1000) {
      return HttpResponse.json(
        { message: "Montant minimum : 1 000 FCFA" },
        { status: 422 }
      );
    }
    if (amount > available) {
      return HttpResponse.json(
        { message: "Solde territoire insuffisant pour ce transfert" },
        { status: 422 }
      );
    }

    const driver = FRANCHISE_DRIVERS.find((d) => d.id === driverId);
    if (!driver) {
      return HttpResponse.json({ message: "Chauffeur introuvable" }, { status: 404 });
    }
    if (driver.account_status !== "approved") {
      return HttpResponse.json(
        { message: "Le compte chauffeur doit être approuvé avant recharge" },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const ref = `DT-F-${Math.floor(100 + Math.random() * 899)}`;
    const transfer: PartnerDriverTransfer = {
      id: ref,
      ref,
      driver_id: driver.id,
      driver_name: `${driver.first_name} ${driver.last_name}`,
      driver_phone: driver.phone,
      amount_fcfa: amount,
      status: "completed",
      mobile_wallet_credited: true,
      note: body.note?.trim() || "Recharge app mobile · territoire",
      created_at: now,
    };

    franchiseDriverTransfers = [transfer, ...franchiseDriverTransfers];
    franchiseRechargeStats = {
      ...franchiseRechargeStats,
      total_spent_fcfa: franchiseRechargeStats.total_spent_fcfa + amount,
      transfers_count: franchiseRechargeStats.transfers_count + 1,
      month_spent_fcfa: franchiseRechargeStats.month_spent_fcfa + amount,
      month_transfers_count: franchiseRechargeStats.month_transfers_count + 1,
      last_transfer_at: now,
    };

    financeState = {
      ...financeState,
      balance_fcfa: financeState.balance_fcfa - amount,
      transactions: [
        {
          id: `ft-${Date.now()}`,
          label: `Recharge ${driver.first_name} ${driver.last_name} · ${ref}`,
          amount_fcfa: amount,
          direction: "debit" as const,
          created_at: now,
        },
        ...financeState.transactions,
      ],
    };

    return HttpResponse.json({
      ok: true,
      message: `Recharge de ${amount.toLocaleString("fr-FR")} FCFA envoyée sur l'app mobile de ${driver.first_name} ${driver.last_name}`,
      transfer,
      finance: {
        ...financeState,
        available_fcfa: franchiseAvailableFcfa(),
      },
      stats: franchiseRechargeStats,
    });
  }),

  http.get("*/api/v2/franchise/promos", ({ request }) => {
    const query = parseListQuery(request);
    const list = franchisePromos.data.filter((p) =>
      matchesSearch(query.search, p.code, p.label)
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/support", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchiseSupport.data.filter((t) =>
      matchesSearch(query.search, t.id, t.subject, t.partner_name)
    );
    if (query.status) list = list.filter((t) => t.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),
];
