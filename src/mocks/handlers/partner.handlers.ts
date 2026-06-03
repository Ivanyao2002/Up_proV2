import { http, HttpResponse } from "msw";
import dashboardPartner from "../data/dashboard-partner.json";
import driversListPartner from "../data/drivers-list-partner.json";
import walletPartnerSeed from "../data/wallet-partner.json";
import driverTransfersPartnerSeed from "../data/driver-wallet-transfers-partner.json";
import partnerProfile from "../data/partner-profile.json";
import fleetList from "../data/fleet-list.json";
import vehicleApproved from "../data/vehicle-detail-approved.json";
import vehiclePending from "../data/vehicle-detail-pending.json";
import vehicleRejected from "../data/vehicle-detail-rejected.json";
import vehicleDraft from "../data/vehicle-detail-draft.json";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import {
  buildPartnerFleetLiveMap,
  getLiveMapCatalogDrivers,
} from "../lib/liveMapBuilder";
import driverTripsSeed from "../data/driver-trips.json";
import driverWalletTxSeed from "../data/driver-wallet-transactions.json";
import bookingsListPartner from "../data/bookings-list-partner.json";
import type {
  Driver,
  Trip,
  TripStatus,
  PartnerWallet,
  PartnerDriverTransfer,
  PartnerDriverRechargeStats,
} from "@/shared/types";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";
import { filterDrivers, DRIVERS_CATALOG } from "../lib/driversCatalog";
import { filterTrips, TRIPS_CATALOG } from "../lib/tripsCatalog";

import shiftsListPartner from "../data/shifts-list-partner.json";
import recurringBookingsPartner from "../data/recurring-bookings-partner.json";
import reportsPartner from "../data/reports-partner.json";

let walletState: PartnerWallet = { ...(walletPartnerSeed as PartnerWallet) };

const transfersSeed = driverTransfersPartnerSeed as {
  stats: PartnerDriverRechargeStats;
  data: PartnerDriverTransfer[];
  meta: { total: number };
};

let driverTransfersState: PartnerDriverTransfer[] = [...transfersSeed.data];
let driverRechargeStats: PartnerDriverRechargeStats = { ...transfersSeed.stats };

const PARTNER_DRIVER_IDS = new Set(
  (driversListPartner.data as Driver[]).map((d) => d.id)
);
const PARTNER_DRIVERS = DRIVERS_CATALOG.filter(
  (d) => PARTNER_DRIVER_IDS.has(d.id) || d.owner_name === "Cocody Express"
);

const driverTripsById = driverTripsSeed as Record<
  string,
  { data: unknown[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }
>;
const driverWalletById = driverWalletTxSeed as Record<
  string,
  { data: unknown[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }
>;

const emptyPage = {
  data: [],
  meta: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
};

const PARTNER_BOOKINGS = [
  ...(bookingsListPartner.data as Trip[]),
  ...TRIPS_CATALOG.filter((t) => t.client_name.includes("Express") || t.ref.startsWith("TR-884")).slice(0, 40),
];

function bookingTimeline(status: TripStatus, createdAt: string) {
  const base = new Date(createdAt);
  const at = (mins: number) =>
    new Date(base.getTime() + mins * 60_000).toISOString();

  const events: {
    id: string;
    type: TripStatus | "matching";
    label: string;
    description?: string;
    at: string;
  }[] = [
    {
      id: "t-requested",
      type: "requested",
      label: "Réservation créée",
      description: "Course enregistrée par le partenaire",
      at: createdAt,
    },
  ];

  if (["matching", "assigned", "arrived", "in_progress", "completed"].includes(status)) {
    events.push({
      id: "t-matching",
      type: "matching",
      label: "Recherche chauffeur",
      at: at(1),
    });
  }
  if (["assigned", "arrived", "in_progress", "completed"].includes(status)) {
    events.push({
      id: "t-assigned",
      type: "assigned",
      label: "Chauffeur assigné",
      at: at(4),
    });
  }
  if (["in_progress", "completed"].includes(status)) {
    events.push({
      id: "t-progress",
      type: "in_progress",
      label: "Course en cours",
      at: at(12),
    });
  }
  if (status === "completed") {
    events.push({
      id: "t-done",
      type: "completed",
      label: "Course terminée",
      at: at(28),
    });
  }
  if (status === "cancelled") {
    events.push({
      id: "t-cancel",
      type: "cancelled",
      label: "Course annulée",
      description: "Annulation avant prise en charge",
      at: at(3),
    });
  }

  return events.reverse();
}

function bookingDetailById(id: string) {
  const base = bookingsListPartner.data.find((b) => b.id === id);
  if (!base) return null;

  const fromLat = base.from_lat ?? 5.3599;
  const fromLng = base.from_lng ?? -4.0083;
  const toLat = base.to_lat ?? 5.32;
  const toLng = base.to_lng ?? -4.01;

  return {
    ...base,
    from_lat: fromLat,
    from_lng: fromLng,
    to_lat: toLat,
    to_lng: toLng,
    timeline: bookingTimeline(base.status as TripStatus, base.created_at),
    estimated_arrival_at:
      base.status === "in_progress"
        ? new Date(Date.now() + 12 * 60_000).toISOString()
        : null,
  };
}

function vehicleDetailById(id: string) {
  switch (id) {
    case "202":
      return vehiclePending;
    case "203":
      return vehicleRejected;
    case "204":
      return vehicleDraft;
    default:
      return { ...vehicleApproved, id: Number(id) || 201 };
  }
}

export const partnerHandlers = [
  http.get("*/api/v2/partner/dashboard", () => {
    return HttpResponse.json(dashboardPartner);
  }),

  http.get("*/api/v2/partner/profile", () => {
    return HttpResponse.json(partnerProfile);
  }),

  http.patch("*/api/v2/partner/profile", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...partnerProfile, ...(body as object) });
  }),

  http.get("*/api/v2/partner/drivers", ({ request }) => {
    const query = parseListQuery(request);
    let list = filterDrivers(PARTNER_DRIVERS, query);
    if (query.account_status) {
      list = list.filter((d) => d.account_status === query.account_status);
    }
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/partner/drivers/:id", ({ params }) => {
    const id = String(params.id);
    if (id === "103") {
      return HttpResponse.json(driverDetailPending);
    }
    return HttpResponse.json({ ...driverDetail, id: Number(id) || 101 });
  }),

  http.get("*/api/v2/partner/drivers/:id/trips", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json(driverTripsById[id] ?? emptyPage);
  }),

  http.get("*/api/v2/partner/drivers/:id/wallet/transactions", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json(driverWalletById[id] ?? emptyPage);
  }),

  http.get("*/api/v2/partner/drivers/:id/live", ({ params }) => {
    const id = String(params.id);
    const driver = getLiveMapCatalogDrivers().find((d) => String(d.id) === id);
    if (!driver) {
      return HttpResponse.json({ message: "Chauffeur hors carte" }, { status: 404 });
    }
    return HttpResponse.json({
      driver,
      bounds: buildPartnerFleetLiveMap().bounds,
      zone_name: "Cocody Express · Flotte",
      city: "Côte d'Ivoire · Abidjan",
      updated_at: new Date().toISOString(),
    });
  }),

  http.get("*/api/v2/partner/ops/map", () => {
    return HttpResponse.json(buildPartnerFleetLiveMap());
  }),

  http.post("*/api/v2/partner/drivers/:id/documents", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { type?: string };
    const base =
      id === "103"
        ? driverDetailPending
        : { ...driverDetail, id: Number(id) || 101 };
    const now = new Date().toISOString();
    const docType = body.type ?? "cni";
    const labels: Record<string, string> = {
      cni: "Carte nationale d'identité",
      license: "Permis de conduire",
      selfie: "Photo selfie",
    };
    const newDoc = {
      id: `doc-${docType}-${id}`,
      type: docType,
      label: labels[docType] ?? docType,
      status: "pending" as const,
      uploaded_at: now,
      reviewed_at: null,
    };
    const existing = base.kyc_documents.filter((d) => d.type !== docType);
    return HttpResponse.json({
      ...base,
      kyc_documents: [...existing, newDoc],
    });
  }),

  http.post("*/api/v2/partner/drivers", async ({ request }) => {
    const body = (await request.json()) as {
      first_name?: string;
      last_name?: string;
      phone?: string;
      zone?: string;
      email?: string;
    };
    const now = new Date().toISOString();
    return HttpResponse.json(
      {
        ...driverDetailPending,
        id: 106,
        first_name: body.first_name ?? "Nouveau",
        last_name: body.last_name ?? "Chauffeur",
        phone: body.phone ?? "",
        email: body.email ?? undefined,
        zone: body.zone ?? "Abidjan",
        vehicle_label: null,
        registered_at: now,
        timeline: [
          {
            id: "t-new",
            type: "registered",
            label: "Inscription",
            description: "Créé depuis l'ajout d'un véhicule",
            at: now,
          },
        ],
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v2/partner/vehicles", ({ request }) => {
    const query = parseListQuery(request);
    let list = fleetList.data.filter((v) =>
      matchesSearch(
        query.search,
        v.plate,
        v.label,
        v.category,
        v.driver_name,
        v.approval_status
      )
    );
    if (query.status) {
      list = list.filter((v) => v.approval_status === query.status);
    }
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.post("*/api/v2/partner/vehicles", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...vehicleDraft,
        id: 205,
        label: `${body.brand} ${body.model}`,
        brand: body.brand,
        model: body.model,
        year: body.year,
        color: body.color,
        category: body.category,
        plate: body.plate ?? "",
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v2/partner/vehicles/:id", ({ params }) => {
    return HttpResponse.json(vehicleDetailById(String(params.id)));
  }),

  http.post("*/api/v2/partner/vehicles/:id/registration", ({ params }) => {
    const id = String(params.id);
    const base = vehicleDetailById(id);
    return HttpResponse.json({
      ...base,
      approval_status: "pending",
      registration_document: {
        ...base.registration_document,
        status: "pending",
        uploaded_at: new Date().toISOString(),
        reviewed_at: null,
        status_note: undefined,
      },
    });
  }),

  http.post("*/api/v2/partner/vehicles/:id/assign-driver", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { driver_name?: string };
    const base = vehicleDetailById(id);
    return HttpResponse.json({
      ...base,
      driver_name: body.driver_name ?? "Chauffeur assigné",
    });
  }),

  http.post("*/api/v2/partner/vehicles/:id/documents", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { type?: string };
    const base = vehicleDetailById(id);
    const now = new Date().toISOString();

    if (body.type === "registration") {
      return HttpResponse.json({
        ...base,
        approval_status: "pending",
        registration_document: {
          ...base.registration_document,
          status: "pending",
          uploaded_at: now,
          reviewed_at: null,
          status_note: undefined,
        },
      });
    }

    return HttpResponse.json({
      ...base,
      approval_status: base.approval_status === "draft" ? "pending" : base.approval_status,
      registration_document: {
        ...base.registration_document,
        uploaded_at: base.registration_document.uploaded_at || now,
      },
    });
  }),

  http.get("*/api/v2/partner/wallet", () => {
    return HttpResponse.json(walletState);
  }),

  http.get("*/api/v2/partner/wallet/driver-transfers/stats", () => {
    return HttpResponse.json(driverRechargeStats);
  }),

  http.get("*/api/v2/partner/wallet/driver-transfers", ({ request }) => {
    const query = parseListQuery(request);
    const list = driverTransfersState.filter((t) =>
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

  http.post("*/api/v2/partner/wallet/driver-recharge", async ({ request }) => {
    const body = (await request.json()) as {
      driver_id?: number;
      amount_fcfa?: number;
      note?: string;
    };
    const driverId = body.driver_id ?? 0;
    const amount = body.amount_fcfa ?? 0;
    if (amount < 1000) {
      return HttpResponse.json(
        { message: "Montant minimum : 1 000 FCFA" },
        { status: 422 }
      );
    }
    if (amount > walletState.available_fcfa) {
      return HttpResponse.json(
        { message: "Solde disponible insuffisant pour ce transfert" },
        { status: 422 }
      );
    }
    const driver = PARTNER_DRIVERS.find((d) => d.id === driverId);
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
    const ref = `DT-${Math.floor(8800 + Math.random() * 999)}`;
    const transfer: PartnerDriverTransfer = {
      id: ref,
      ref,
      driver_id: driver.id,
      driver_name: `${driver.first_name} ${driver.last_name}`,
      driver_phone: driver.phone,
      amount_fcfa: amount,
      status: "completed",
      mobile_wallet_credited: true,
      note: body.note?.trim() || "Recharge app mobile",
      created_at: now,
    };

    driverTransfersState = [transfer, ...driverTransfersState];
    driverRechargeStats = {
      ...driverRechargeStats,
      total_spent_fcfa: driverRechargeStats.total_spent_fcfa + amount,
      transfers_count: driverRechargeStats.transfers_count + 1,
      month_spent_fcfa: driverRechargeStats.month_spent_fcfa + amount,
      month_transfers_count: driverRechargeStats.month_transfers_count + 1,
      last_transfer_at: now,
    };

    walletState = {
      ...walletState,
      balance_fcfa: walletState.balance_fcfa - amount,
      available_fcfa: walletState.available_fcfa - amount,
      recent_movements: [
        {
          id: `M-${Date.now()}`,
          label: `Recharge ${driver.first_name} ${driver.last_name} · ${ref}`,
          amount_fcfa: amount,
          direction: "debit",
          created_at: now,
        },
        ...walletState.recent_movements,
      ],
    };

    return HttpResponse.json({
      ok: true,
      message: `Recharge de ${amount.toLocaleString("fr-FR")} FCFA envoyée sur l'app mobile de ${driver.first_name} ${driver.last_name}`,
      transfer,
      wallet: walletState,
      stats: driverRechargeStats,
    });
  }),

  http.post("*/api/v2/partner/wallet/withdraw", async ({ request }) => {
    const body = (await request.json()) as { amount_fcfa?: number };
    const amount = body.amount_fcfa ?? 0;
    if (amount <= 0) {
      return HttpResponse.json({ message: "Montant invalide" }, { status: 422 });
    }
    if (amount > walletState.available_fcfa) {
      return HttpResponse.json(
        { message: "Solde disponible insuffisant" },
        { status: 422 }
      );
    }
    const ref = `WD-${Math.floor(4400 + Math.random() * 999)}`;
    const now = new Date().toISOString();
    walletState = {
      ...walletState,
      balance_fcfa: walletState.balance_fcfa - amount,
      available_fcfa: walletState.available_fcfa - amount,
      pending_withdrawal_fcfa: walletState.pending_withdrawal_fcfa + amount,
      last_withdrawal: {
        id: ref,
        amount_fcfa: amount,
        status: "pending",
        processed_at: now,
      },
      recent_movements: [
        {
          id: `M-${Date.now()}`,
          label: `Demande retrait ${ref}`,
          amount_fcfa: amount,
          direction: "debit",
          created_at: now,
        },
        ...walletState.recent_movements,
      ],
    };
    return HttpResponse.json({
      ok: true,
      message: "Demande de retrait enregistrée",
      withdrawal_id: ref,
      wallet: walletState,
    });
  }),

  http.get("*/api/v2/partner/shifts", ({ request }) => {
    const query = parseListQuery(request);
    const list = shiftsListPartner.data.filter((s) =>
      matchesSearch(
        query.search,
        s.driver_name,
        s.vehicle_label,
        s.day_label,
        String(s.id)
      )
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/partner/bookings/recurring", ({ request }) => {
    const query = parseListQuery(request);
    const list = recurringBookingsPartner.data.filter((b) =>
      matchesSearch(
        query.search,
        b.client_name,
        b.from_label,
        b.to_label,
        b.frequency
      )
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/partner/reports", ({ request }) => {
    const query = parseListQuery(request);
    const list = reportsPartner.data.filter((r) =>
      matchesSearch(query.search, r.period_label, r.id)
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/partner/bookings", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterTrips(PARTNER_BOOKINGS, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/partner/bookings/:id", ({ params }) => {
    const detail = bookingDetailById(String(params.id));
    if (!detail) {
      return HttpResponse.json({ message: "Réservation introuvable" }, { status: 404 });
    }
    return HttpResponse.json(detail);
  }),

  http.post("*/api/v2/partner/bookings/:id/cancel", ({ params }) => {
    const id = String(params.id);
    const idx = bookingsListPartner.data.findIndex((b) => b.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Réservation introuvable" }, { status: 404 });
    }
    const booking = bookingsListPartner.data[idx];
    if (!["requested", "matching", "assigned"].includes(booking.status)) {
      return HttpResponse.json(
        { message: "Cette réservation ne peut plus être annulée" },
        { status: 422 }
      );
    }
    bookingsListPartner.data[idx] = { ...booking, status: "cancelled" };
    return HttpResponse.json({
      ok: true,
      message: "Réservation annulée",
      booking: bookingDetailById(id),
    });
  }),

  http.post("*/api/v2/partner/bookings", async ({ request }) => {
    const body = (await request.json()) as {
      from_label?: string;
      to_label?: string;
      from_lat?: number;
      from_lng?: number;
      to_lat?: number;
      to_lng?: number;
      client_name?: string;
      client_phone?: string;
      service?: string;
      payment_method?: string;
      notes?: string;
    };
    const ref = `TR-${Math.floor(88000 + Math.random() * 999)}`;
    const amount = 4500 + Math.floor(Math.random() * 3000);
    const createdAt = new Date().toISOString();
    const created = {
      id: String(Date.now()),
      ref,
      status: "matching" as const,
      amount_fcfa: amount,
      estimated_amount_fcfa: amount,
      from_label: body.from_label ?? "",
      to_label: body.to_label ?? "",
      from_lat: body.from_lat ?? 5.3599,
      from_lng: body.from_lng ?? -4.0083,
      to_lat: body.to_lat ?? 5.32,
      to_lng: body.to_lng ?? -4.01,
      client_name: body.client_name ?? "",
      client_phone: body.client_phone ?? "",
      service: body.service ?? "taxi",
      payment_method: body.payment_method ?? "cash",
      notes: body.notes,
      created_at: createdAt,
    };
    (bookingsListPartner.data as typeof bookingsListPartner.data).unshift(
      created as (typeof bookingsListPartner.data)[0]
    );
    bookingsListPartner.meta.total += 1;
    return HttpResponse.json(
      {
        ...created,
        timeline: bookingTimeline("matching", createdAt),
      },
      { status: 201 }
    );
  }),
];
