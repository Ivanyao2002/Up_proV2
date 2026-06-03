import franchisesListSeed from "../data/franchises-list.json";
import partnersListSeed from "../data/partners-list.json";
import zonesListSeed from "../data/zones-list.json";
import type { Franchise, Partner, Zone } from "@/shared/types";

type ListMeta = { total: number; per_page: number; current_page: number; last_page: number };

export let franchisesState = {
  data: franchisesListSeed.data as Franchise[],
  meta: franchisesListSeed.meta as ListMeta,
};

export let partnersState = {
  data: partnersListSeed.data as Partner[],
  meta: partnersListSeed.meta as ListMeta,
};

export let zonesState = {
  data: zonesListSeed.data as Zone[],
  meta: zonesListSeed.meta as ListMeta,
};

export function nextFranchiseId(): number {
  const ids = franchisesState.data.map((f) => f.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

export function nextPartnerId(): number {
  const ids = partnersState.data.map((p) => p.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

export function nextZoneId(): number {
  const ids = zonesState.data.map((z) => z.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

export function franchiseName(id: number): string {
  return franchisesState.data.find((f) => f.id === id)?.name ?? "";
}
