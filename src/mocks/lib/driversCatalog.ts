import driversList from "../data/drivers-list.json";
import type { Driver } from "@/shared/types";
import { applyDriverAdminOverrides } from "./driverAdminOverrides";
import type { ListQuery } from "./listQuery";
import { matchesSearch } from "./listQuery";

const ZONES = ["Cocody", "Yopougon", "Plateau", "Marcory", "Treichville", "Adjamé"];
const OWNERS = ["Cocody Express", "Marcory Fleet", "Yopougon Transit", "Plateau VIP"];
const FIRST = ["Kouassi", "Traoré", "Diabaté", "Bamba", "Ouattara", "Koné", "Aka"];
const LAST = ["Jean", "Aminata", "Moussa", "Serge", "Fatou", "Issa", "Aya"];

function buildCatalog(): Driver[] {
  const seed = driversList.data as Driver[];
  const rows: Driver[] = [...seed];
  for (let i = 0; i < 148; i++) {
    const template = seed[i % seed.length];
    const id = 200 + i;
    rows.push({
      ...template,
      id,
      first_name: FIRST[i % FIRST.length],
      last_name: LAST[(i + 2) % LAST.length],
      phone: `+225 07 ${String(10 + (i % 89)).padStart(2, "0")} ${String(i % 100).padStart(2, "0")} ${String((i * 7) % 100).padStart(2, "0")} ${String((i * 3) % 100).padStart(2, "0")}`,
      zone: ZONES[i % ZONES.length],
      owner_name: OWNERS[i % OWNERS.length],
      rating: Number((3.8 + (i % 12) * 0.08).toFixed(2)),
      availability: i % 5 === 0 ? "offline" : "online",
      account_status:
        i % 31 === 0 ? "suspended" : i % 17 === 0 ? "pending" : "approved",
    });
  }
  return rows;
}

export const DRIVERS_CATALOG = buildCatalog();

export function filterDrivers(rows: Driver[], query: ListQuery): Driver[] {
  let list = rows.filter((d) =>
    matchesSearch(
      query.search,
      `${d.first_name} ${d.last_name}`,
      d.phone,
      d.zone,
      d.owner_name,
      d.vehicle_label ?? ""
    )
  );
  if (query.account_status) {
    list = list.filter((d) => d.account_status === query.account_status);
  }
  if (query.availability) {
    list = list.filter((d) => d.availability === query.availability);
  }
  if (query.zone) {
    list = list.filter((d) => d.zone === query.zone);
  }
  return list.map(applyDriverAdminOverrides);
}

export const DRIVER_ZONE_OPTIONS = [
  "Cocody",
  "Yopougon",
  "Plateau",
  "Marcory",
  "Treichville",
  "Adjamé",
] as const;
