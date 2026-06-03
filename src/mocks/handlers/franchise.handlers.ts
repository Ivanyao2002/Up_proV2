import { http, HttpResponse } from "msw";
import dashboardFranchise from "../data/dashboard-franchise.json";
import subPartners from "../data/sub-partners-franchise.json";
import driversListFranchiseSeed from "../data/drivers-list-franchise.json";
import financeFranchise from "../data/finance-franchise.json";
import territoryFranchise from "../data/territory-franchise.json";
import franchisePromos from "../data/franchise-promos.json";
import franchiseSupport from "../data/franchise-support-tickets.json";
import franchiseKycQueueSeed from "../data/franchise-kyc-queue.json";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import type { Driver, DriverDetail, KycQueueItem } from "@/shared/types";

type DriversList = { data: Driver[]; meta: typeof driversListFranchiseSeed.meta };
type KycQueue = { data: KycQueueItem[]; meta: typeof franchiseKycQueueSeed.meta };

let driversState: DriversList = {
  data: driversListFranchiseSeed.data as Driver[],
  meta: driversListFranchiseSeed.meta,
};

let kycQueueState: KycQueue = {
  data: franchiseKycQueueSeed.data as KycQueueItem[],
  meta: franchiseKycQueueSeed.meta,
};

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

  http.get("*/api/v2/franchise/territory", () => {
    return HttpResponse.json(territoryFranchise);
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
    return HttpResponse.json(driversState);
  }),

  http.get("*/api/v2/franchise/drivers/kyc-queue", () => {
    return HttpResponse.json(kycQueueState);
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
          description: "Validation franchise Abidjan Sud",
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
    return HttpResponse.json(financeFranchise);
  }),

  http.get("*/api/v2/franchise/promos", () => {
    return HttpResponse.json(franchisePromos);
  }),

  http.get("*/api/v2/franchise/support", () => {
    return HttpResponse.json(franchiseSupport);
  }),
];
