import franchisesList from "../data/franchises-list.json";
import partnersList from "../data/partners-list.json";
import type { LiveMapData, LiveMapDriver } from "@/shared/types";

type CatalogDriver = LiveMapDriver & {
  franchise_id: number;
  franchise_name: string;
  partner_id: number;
  partner_name: string;
  zone_name: string;
};

/** Catalogue mondial — chauffeurs répartis par pays / franchise / partenaire */
const LIVE_MAP_CATALOG: CatalogDriver[] = [
  {
    id: 101,
    name: "Kouassi Jean",
    lat: 5.359,
    lng: -3.987,
    availability: "on_trip",
    vehicle: "Toyota Corolla",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 12,
    partner_name: "Cocody Express",
    zone_name: "Abidjan — Cocody",
  },
  {
    id: 102,
    name: "Traoré Aminata",
    lat: 5.336,
    lng: -4.021,
    availability: "online",
    vehicle: "Suzuki Dzire",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 12,
    partner_name: "Cocody Express",
    zone_name: "Abidjan — Plateau",
  },
  {
    id: 104,
    name: "Bamba Serge",
    lat: 5.312,
    lng: -3.965,
    availability: "online",
    vehicle: "Honda Civic",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 15,
    partner_name: "Marcory Fleet",
    zone_name: "Abidjan — Marcory",
  },
  {
    id: 105,
    name: "Koné Aya",
    lat: 5.348,
    lng: -4.008,
    availability: "on_trip",
    vehicle: "Hyundai Accent",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 15,
    partner_name: "Marcory Fleet",
    zone_name: "Abidjan — Zone 4",
  },
  {
    id: 106,
    name: "Ouattara Issa",
    lat: 7.694,
    lng: -5.031,
    availability: "online",
    vehicle: "Toyota Yaris",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 12,
    partner_name: "Cocody Express",
    zone_name: "Bouaké centre",
  },
  {
    id: 108,
    name: "Yao N'Guessan",
    lat: 6.827,
    lng: -5.289,
    availability: "online",
    vehicle: "Peugeot 301",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 15,
    partner_name: "Marcory Fleet",
    zone_name: "Yamoussoukro",
  },
  {
    id: 109,
    name: "Diabaté Moussa",
    lat: 5.351,
    lng: -4.015,
    availability: "on_trip",
    vehicle: "Toyota Corolla",
    franchise_id: 1,
    franchise_name: "Côte d'Ivoire",
    partner_id: 12,
    partner_name: "Cocody Express",
    zone_name: "Abidjan — Aéroport FHB",
  },
  {
    id: 201,
    name: "Jean Tremblay",
    lat: 45.508,
    lng: -73.574,
    availability: "online",
    vehicle: "Toyota Camry",
    franchise_id: 2,
    franchise_name: "Canada",
    partner_id: 22,
    partner_name: "Montréal North Mobility",
    zone_name: "Montréal — Centre-ville",
  },
  {
    id: 202,
    name: "Marie Lavoie",
    lat: 45.501,
    lng: -73.552,
    availability: "on_trip",
    vehicle: "Honda CR-V",
    franchise_id: 2,
    franchise_name: "Canada",
    partner_id: 22,
    partner_name: "Montréal North Mobility",
    zone_name: "Montréal — Plateau",
  },
  {
    id: 203,
    name: "Alex Chen",
    lat: 43.653,
    lng: -79.383,
    availability: "online",
    vehicle: "Tesla Model 3",
    franchise_id: 2,
    franchise_name: "Canada",
    partner_id: 22,
    partner_name: "Montréal North Mobility",
    zone_name: "Toronto — Downtown",
  },
  {
    id: 204,
    name: "Sophie Martin",
    lat: 45.515,
    lng: -73.589,
    availability: "paused",
    vehicle: "Nissan Leaf",
    franchise_id: 2,
    franchise_name: "Canada",
    partner_id: 22,
    partner_name: "Montréal North Mobility",
    zone_name: "Montréal — Vieux-Port",
  },
  {
    id: 301,
    name: "Lucas Bernard",
    lat: 48.873,
    lng: 2.295,
    availability: "online",
    vehicle: "Peugeot 508",
    franchise_id: 3,
    franchise_name: "Espace euro",
    partner_id: 31,
    partner_name: "Île-de-France VTC",
    zone_name: "Paris — Champs-Élysées",
  },
  {
    id: 302,
    name: "Emma Dubois",
    lat: 48.856,
    lng: 2.352,
    availability: "on_trip",
    vehicle: "Renault Mégane",
    franchise_id: 3,
    franchise_name: "Espace euro",
    partner_id: 31,
    partner_name: "Île-de-France VTC",
    zone_name: "Paris — Marais",
  },
  {
    id: 303,
    name: "Marco Rossi",
    lat: 45.764,
    lng: 4.835,
    availability: "online",
    vehicle: "Fiat Tipo",
    franchise_id: 3,
    franchise_name: "Espace euro",
    partner_id: 31,
    partner_name: "Île-de-France VTC",
    zone_name: "Lyon — Presqu'île",
  },
  {
    id: 304,
    name: "Anna Müller",
    lat: 50.11,
    lng: 8.682,
    availability: "online",
    vehicle: "VW Golf",
    franchise_id: 3,
    franchise_name: "Espace euro",
    partner_id: 31,
    partner_name: "Île-de-France VTC",
    zone_name: "Francfort — Centre",
  },
  {
    id: 305,
    name: "James O'Brien",
    lat: 51.507,
    lng: -0.128,
    availability: "on_trip",
    vehicle: "Toyota Prius",
    franchise_id: 3,
    franchise_name: "Espace euro",
    partner_id: 31,
    partner_name: "Île-de-France VTC",
    zone_name: "Londres — City",
  },
  {
    id: 401,
    name: "Mamadou Fall",
    lat: 14.716,
    lng: -17.467,
    availability: "online",
    vehicle: "Hyundai i10",
    franchise_id: 4,
    franchise_name: "Sénégal",
    partner_id: 38,
    partner_name: "Dakar Rides",
    zone_name: "Dakar — Plateau",
  },
  {
    id: 402,
    name: "Aïssatou Diop",
    lat: 14.692,
    lng: -17.445,
    availability: "paused",
    vehicle: "Suzuki Swift",
    franchise_id: 4,
    franchise_name: "Sénégal",
    partner_id: 38,
    partner_name: "Dakar Rides",
    zone_name: "Dakar — Almadies",
  },
];

const FRANCHISES = franchisesList.data as {
  id: number;
  name: string;
  city: string;
}[];

const PARTNERS = partnersList.data as {
  id: number;
  name: string;
  franchise_id: number;
  franchise_name: string;
  city: string;
}[];

function computeBounds(drivers: CatalogDriver[]) {
  if (drivers.length === 0) {
    return { lat_min: -10, lat_max: 60, lng_min: -80, lng_max: 20 };
  }
  const lats = drivers.map((d) => d.lat);
  const lngs = drivers.map((d) => d.lng);
  const latPad = Math.max(0.08, (Math.max(...lats) - Math.min(...lats)) * 0.12);
  const lngPad = Math.max(0.12, (Math.max(...lngs) - Math.min(...lngs)) * 0.12);
  return {
    lat_min: Math.min(...lats) - latPad,
    lat_max: Math.max(...lats) + latPad,
    lng_min: Math.min(...lngs) - lngPad,
    lng_max: Math.max(...lngs) + lngPad,
  };
}

function computeStats(drivers: CatalogDriver[]) {
  const online = drivers.filter((d) => d.availability === "online").length;
  const onTrip = drivers.filter((d) => d.availability === "on_trip").length;
  return {
    drivers_online: online,
    drivers_on_trip: onTrip,
    active_trips: onTrip + Math.min(8, online),
    avg_wait_min: drivers.length > 12 ? 4.8 : 3.6,
  };
}

function franchiseSummary(drivers: CatalogDriver[]) {
  const byFranchise = new Map<number, CatalogDriver[]>();
  for (const d of drivers) {
    const list = byFranchise.get(d.franchise_id) ?? [];
    list.push(d);
    byFranchise.set(d.franchise_id, list);
  }
  return FRANCHISES.filter((f) => byFranchise.has(f.id)).map((f) => {
    const list = byFranchise.get(f.id)!;
    return {
      franchise_id: f.id,
      franchise_name: f.name,
      drivers_visible: list.length,
      drivers_active: list.filter(
        (d) => d.availability === "online" || d.availability === "on_trip"
      ).length,
    };
  });
}

export function getLiveMapCatalogDrivers() {
  return LIVE_MAP_CATALOG;
}

export function buildLiveMapFromDrivers(
  drivers: CatalogDriver[],
  meta: {
    zone_name: string;
    city: string;
    scope: LiveMapData["scope"];
    includeFilterOptions?: boolean;
    active_filter?: LiveMapData["active_filter"];
  }
): LiveMapData {
  return {
    zone_name: meta.zone_name,
    city: meta.city,
    scope: meta.scope,
    stats: computeStats(drivers),
    bounds: computeBounds(drivers),
    drivers,
    filter_options: meta.includeFilterOptions
      ? {
          franchises: FRANCHISES.map((f) => ({
            id: f.id,
            name: f.name,
            city: f.city,
          })),
          partners: PARTNERS.map((p) => ({
            id: p.id,
            name: p.name,
            franchise_id: p.franchise_id,
            franchise_name: p.franchise_name,
            city: p.city,
          })),
        }
      : undefined,
    active_filter: meta.active_filter,
    franchise_summary:
      meta.scope === "global" && drivers.length === LIVE_MAP_CATALOG.length
        ? franchiseSummary(LIVE_MAP_CATALOG)
        : undefined,
  };
}

export function buildAdminLiveMap(query: {
  franchise_id?: string | null;
  partner_id?: string | null;
}): LiveMapData {
  const franchiseId = query.franchise_id ? Number(query.franchise_id) : null;
  const partnerId = query.partner_id ? Number(query.partner_id) : null;

  let drivers = [...LIVE_MAP_CATALOG];
  let scope: LiveMapData["scope"] = "global";
  let zone_name = "Vue mondiale";
  let city = `${FRANCHISES.length} pays · ${PARTNERS.length} partenaires actifs`;

  if (partnerId) {
    drivers = drivers.filter((d) => d.partner_id === partnerId);
    const partner = PARTNERS.find((p) => p.id === partnerId);
    scope = "partner";
    zone_name = partner?.name ?? "Partenaire";
    city = `${partner?.franchise_name ?? ""} · ${partner?.city ?? ""}`;
  } else if (franchiseId) {
    drivers = drivers.filter((d) => d.franchise_id === franchiseId);
    const franchise = FRANCHISES.find((f) => f.id === franchiseId);
    scope = "franchise";
    zone_name = franchise?.name ?? "Franchise";
    city = `Siège · ${franchise?.city ?? ""}`;
  }

  const partnersForFilters = franchiseId
    ? PARTNERS.filter((p) => p.franchise_id === franchiseId)
    : PARTNERS;

  return buildLiveMapFromDrivers(drivers, {
    zone_name,
    city,
    scope,
    includeFilterOptions: true,
    active_filter: {
      franchise_id: franchiseId,
      partner_id: partnerId,
    },
  });
}

/** Sous-ensemble pour dispatch / carte locale Abidjan */
export function buildLocalAbidjanLiveMap(): LiveMapData {
  const drivers = LIVE_MAP_CATALOG.filter((d) => d.franchise_id === 1 && d.lat < 6);
  return buildLiveMapFromDrivers(drivers, {
    zone_name: "Côte d'Ivoire — Abidjan",
    city: "Abidjan",
    scope: "franchise",
  });
}

export function buildPartnerFleetLiveMap(): LiveMapData {
  const drivers = LIVE_MAP_CATALOG.filter((d) =>
    [12, 15].includes(d.partner_id)
  );
  return buildLiveMapFromDrivers(drivers, {
    zone_name: "Cocody Express · Flotte",
    city: "Côte d'Ivoire · Abidjan",
    scope: "partner",
  });
}

export function filterCatalogByFranchise(franchiseId: number) {
  return LIVE_MAP_CATALOG.filter((d) => d.franchise_id === franchiseId);
}

export function filterCatalogByPartnerIds(ids: Set<number>) {
  return LIVE_MAP_CATALOG.filter((d) => ids.has(d.partner_id));
}
