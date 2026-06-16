import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { AssistantApiResponse } from "@/features/assistant/types";
import {
  type AdminEntityKey,
  ENTITY_DETAIL_API,
  ENTITY_LIST_API,
  entityDetailPath,
  entityListPath,
  getEntityDef,
} from "@/features/assistant/catalog/adminEntities";
import { normalizePlate } from "./detectIntent";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

export interface SearchCandidate {
  id: string;
  label: string;
  kind: AdminEntityKey;
}

async function apiGet<T>(
  path: string,
  authHeader: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Client-Type": "back-office",
  };
  if (authHeader) headers.Authorization = authHeader;

  const response = await fetch(`${API_ORIGIN}${path}`, { headers });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

function norm(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function normName(value: string): string {
  return norm(value).replace(/[''`]/g, "");
}

function scoreDriverMatch(item: Record<string, unknown>, query: string): number {
  const q = normName(query);
  if (!q) return 0;

  const profile = item.profile as Record<string, unknown> | undefined;
  const firstName = normName(String(item.firstName ?? item.first_name ?? profile?.firstName ?? ""));
  const lastName = normName(String(item.lastName ?? item.last_name ?? profile?.lastName ?? ""));
  const display = normName(String(profile?.displayName ?? ""));
  const full = `${firstName} ${lastName}`.trim();
  const code = normName(String(item.driver_code ?? ""));

  if (lastName === q) return 120;
  if (lastName.includes(q) && q.length >= 3) return 110;
  if (full.includes(q)) return 100;
  if (display.includes(q)) return 95;
  if (firstName.includes(q) && q.length >= 3) return 85;
  if (code.includes(q)) return 70;

  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length > 1) {
    const allInName = tokens.every(
      (t) => firstName.includes(t) || lastName.includes(t) || display.includes(t)
    );
    if (allInName) return 105;
  }

  if (/^seed\s/.test(display) && !q.includes("seed")) return 10;

  return 50;
}

export async function resolveDriverByQuery(
  query: string,
  authHeader: string | null
): Promise<{ id: string; label: string; item: Record<string, unknown> } | null> {
  const raw = query.trim();
  if (!raw) return null;

  let matches = await searchEntityMatches("drivers", raw, authHeader);
  const shortToken = cleanDriverToken(raw);
  if (!matches.length && shortToken && shortToken !== raw) {
    matches = await searchEntityMatches("drivers", shortToken, authHeader);
  }

  if (!matches.length) return null;

  const ranked = [...matches].sort(
    (a, b) => scoreDriverMatch(b, shortToken || raw) - scoreDriverMatch(a, shortToken || raw)
  );
  const best = ranked[0]!;
  return {
    id: getItemId(best),
    label: getItemLabel("drivers", best),
    item: best,
  };
}

function cleanDriverToken(query: string): string {
  return query.split(/[,;]/)[0]?.trim().split(/\s+pui|\s+puis|\s+si\s+/i)[0]?.trim() ?? query;
}

function textIncludes(hay: string, needle: string): boolean {
  const h = norm(hay);
  const n = norm(needle);
  return h.includes(n) || n.includes(h);
}

function pickItems(data: unknown, entity: AdminEntityKey): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;

  if (entity === "trips") {
    const rides = (o.rides as Record<string, unknown>[]) ?? [];
    const deliveries = (o.deliveries as Record<string, unknown>[]) ?? [];
    return [...rides, ...deliveries];
  }
  if (entity === "clients") {
    return (
      (o.users as Record<string, unknown>[]) ??
      (o.items as Record<string, unknown>[]) ??
      []
    );
  }
  if (entity === "zones") {
    return (o.zones as Record<string, unknown>[]) ?? (o.items as Record<string, unknown>[]) ?? [];
  }
  if (entity === "transactions" || entity === "withdrawals") {
    return (o.items as Record<string, unknown>[]) ?? (o.data as Record<string, unknown>[]) ?? [];
  }
  if (entity === "tickets" || entity === "chat") {
    return (o.items as Record<string, unknown>[]) ?? (o.tickets as Record<string, unknown>[]) ?? [];
  }

  return (o.items as Record<string, unknown>[]) ?? [];
}

export function getItemId(item: Record<string, unknown>): string {
  const id = item.id ?? item.uuid;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

function itemId(item: Record<string, unknown>): string {
  return getItemId(item);
}

export function getItemLabel(
  entity: AdminEntityKey,
  item: Record<string, unknown>
): string {
  return itemLabel(entity, item);
}

function itemLabel(entity: AdminEntityKey, item: Record<string, unknown>): string {
  switch (entity) {
    case "drivers": {
      const profile = item.profile as Record<string, unknown> | undefined;
      const fullName = [item.firstName ?? item.first_name, item.lastName ?? item.last_name]
        .filter(Boolean)
        .join(" ");
      const name =
        (profile?.displayName as string) ??
        (fullName || undefined) ??
        (item.driver_code as string) ??
        `Chauffeur ${itemId(item).slice(0, 8)}`;
      const phone = (item.phone as string) ?? (profile?.phone as string);
      return phone ? `${name} (${phone})` : String(name);
    }
    case "vehicles": {
      const plate = (item.plate_number as string)?.trim();
      return plate || `Véhicule ${itemId(item).slice(0, 8)}`;
    }
    case "clients": {
      const profile = item.profile as Record<string, unknown> | undefined;
      return (
        (profile?.displayName as string) ??
        (item.full_name as string) ??
        (item.email as string) ??
        (item.phone as string) ??
        `Client ${itemId(item).slice(0, 8)}`
      );
    }
    case "franchises":
      return (
        (item.name as string) ??
        (item.code as string) ??
        `Franchise ${itemId(item).slice(0, 8)}`
      );
    case "partners":
      return (
        (item.trade_name as string) ??
        (item.legal_name as string) ??
        (item.name as string) ??
        `Partenaire ${itemId(item).slice(0, 8)}`
      );
    case "zones":
      return (item.name as string) ?? `Zone ${itemId(item).slice(0, 8)}`;
    case "trips":
      return `${itemId(item).slice(0, 8)}… · ${(item.status as string) ?? "—"}`;
    case "transactions":
      return `${itemId(item).slice(0, 8)}… · ${(item.type as string) ?? (item.status as string) ?? "—"}`;
    case "withdrawals":
      return `${itemId(item).slice(0, 8)}… · ${(item.status as string) ?? "—"}`;
    case "promos":
      return (item.code as string) ?? (item.name as string) ?? itemId(item).slice(0, 12);
    case "campaigns":
      return (item.name as string) ?? (item.title as string) ?? itemId(item).slice(0, 12);
    case "banners":
      return (item.title as string) ?? (item.name as string) ?? itemId(item).slice(0, 12);
    case "tickets":
    case "chat":
      return (item.subject as string) ?? `Ticket ${itemId(item).slice(0, 8)}`;
    case "roles":
      return (item.name as string) ?? (item.slug as string) ?? itemId(item).slice(0, 12);
    case "pricing":
    case "commission-rules":
      return (item.name as string) ?? (item.label as string) ?? itemId(item).slice(0, 12);
    case "sos-incidents":
      return `Incident ${itemId(item).slice(0, 8)} · ${(item.status as string) ?? "—"}`;
    default:
      return itemId(item).slice(0, 12) || "Élément";
  }
}

function itemMatches(
  entity: AdminEntityKey,
  item: Record<string, unknown>,
  query: string
): boolean {
  const q = norm(query);
  const qPlate = normalizePlate(query);
  const id = itemId(item).toLowerCase();

  if (id === q || id.includes(q)) return true;

  const fields: string[] = [];
  switch (entity) {
    case "vehicles":
      if (item.plate_number) fields.push(String(item.plate_number));
      if (item.vin) fields.push(String(item.vin));
      break;
    case "drivers":
      if (item.driver_code) fields.push(String(item.driver_code));
      if (item.phone) fields.push(String(item.phone));
      if (item.firstName) fields.push(String(item.firstName));
      if (item.lastName) fields.push(String(item.lastName));
      if (item.first_name) fields.push(String(item.first_name));
      if (item.last_name) fields.push(String(item.last_name));
      if (item.partnerName) fields.push(String(item.partnerName));
      if (item.partner_name) fields.push(String(item.partner_name));
      if (item.vehicleLabel) fields.push(String(item.vehicleLabel));
      if (item.vehicle_label) fields.push(String(item.vehicle_label));
      {
        const full = [
          item.firstName ?? item.first_name,
          item.lastName ?? item.last_name,
        ]
          .filter(Boolean)
          .join(" ");
        if (full) fields.push(full);
      }
      if (item.profile) {
        const p = item.profile as Record<string, unknown>;
        if (p.displayName) fields.push(String(p.displayName));
        if (p.phone) fields.push(String(p.phone));
        if (p.email) fields.push(String(p.email));
      }
      break;
    case "clients": {
      const qn = normName(query);
      const profile = item.profile as Record<string, unknown> | undefined;
      const display = normName(
        String(profile?.displayName ?? item.full_name ?? item.name ?? "")
      );
      const email = norm(String(item.email ?? ""));
      const phone = String(item.phone ?? "").replace(/\s/g, "");
      const qPhone = query.replace(/\s/g, "");

      if (display && (display === qn || display.includes(qn) || qn.includes(display))) {
        return true;
      }
      if (item.phone && phone.includes(qPhone)) return true;
      if (item.email && email.includes(norm(query))) return true;
      if (item.full_name) fields.push(String(item.full_name));
      if (item.profile) {
        const p = item.profile as Record<string, unknown>;
        if (p.displayName) fields.push(String(p.displayName));
      }
      break;
    }
    case "franchises":
      if (item.name) fields.push(String(item.name));
      if (item.code) fields.push(String(item.code));
      if (item.legal_name) fields.push(String(item.legal_name));
      break;
    case "partners":
      if (item.trade_name) fields.push(String(item.trade_name));
      if (item.legal_name) fields.push(String(item.legal_name));
      if (item.name) fields.push(String(item.name));
      if (item.contact_phone) fields.push(String(item.contact_phone));
      break;
    case "zones":
      if (item.name) fields.push(String(item.name));
      if (item.city) fields.push(String(item.city));
      break;
    case "promos":
      if (item.code) fields.push(String(item.code));
      if (item.name) fields.push(String(item.name));
      break;
    default:
      break;
  }

  for (const f of fields) {
    if (entity === "vehicles") {
      if (normalizePlate(f) === qPlate || normalizePlate(f).includes(qPlate)) {
        return true;
      }
    }
    if (textIncludes(f, query)) return true;
  }

  return JSON.stringify(item).toLowerCase().includes(q);
}

export function resolveListEntity(entity: AdminEntityKey): AssistantApiResponse {
  const def = getEntityDef(entity);
  return {
    message: `J'ouvre la liste des ${def.labelPlural}.`,
    action: { type: "LIST_ENTITY", entity },
  };
}

export async function searchEntityMatches(
  entity: AdminEntityKey,
  query: string,
  authHeader: string | null
): Promise<Record<string, unknown>[]> {
  const q = query.trim();
  const def = getEntityDef(entity);

  if (def.detailPath && ENTITY_DETAIL_API[entity] && /^[0-9a-f-]{8,}$/i.test(q)) {
    const ok = await apiGet<unknown>(ENTITY_DETAIL_API[entity]!(q), authHeader).catch(
      () => null
    );
    if (ok) {
      const record =
        ok && typeof ok === "object" && "vehicle" in (ok as object)
          ? ((ok as { vehicle?: Record<string, unknown> }).vehicle ?? { id: q })
          : ok && typeof ok === "object" && "id" in (ok as object)
            ? (ok as Record<string, unknown>)
            : { id: q };
      return [record];
    }
  }

  const listApi = ENTITY_LIST_API[entity];
  if (!listApi) return [];

  let items: Record<string, unknown>[] = [];
  const listPath = `${listApi}${buildV1ListQuery({ per_page: 200, page: 1 })}`;
  const listData = await apiGet<unknown>(listPath, authHeader);
  items = pickItems(listData, entity);

  const searched = await apiGet<unknown>(
    `${listApi}${buildV1ListQuery({ search: q, per_page: 50, page: 1 })}`,
    authHeader
  ).catch(() => null);
  if (searched) {
    const extra = pickItems(searched, entity);
    const seen = new Set(items.map(itemId));
    for (const item of extra) {
      const id = itemId(item);
      if (id && !seen.has(id)) items.push(item);
    }
  }

  return items.filter((item) => itemMatches(entity, item, q));
}

export async function resolveFindEntity(
  entity: AdminEntityKey,
  query: string,
  authHeader: string | null
): Promise<AssistantApiResponse> {
  const def = getEntityDef(entity);
  const q = query.trim();
  const matches = await searchEntityMatches(entity, q, authHeader);

  if (matches.length === 0) {
    return {
      message: `Aucun ${def.label} trouvé pour « ${q} ».`,
      action: { type: "LIST_ENTITY", entity },
    };
  }
  if (matches.length === 1) {
    const id = itemId(matches[0]);
    return {
      message: `J'ouvre ${def.label} : ${itemLabel(entity, matches[0])}.`,
      action: { type: "OPEN_ENTITY", entity, id },
    };
  }

  return {
    message: `${matches.length} ${def.labelPlural} correspondent à « ${q} ».`,
    action: { type: "LIST_ENTITY", entity },
    candidates: matches.slice(0, 5).map((item) => ({
      id: itemId(item),
      label: itemLabel(entity, item),
      kind: entity,
    })),
  };
}

export function resolveOpenEntity(
  entity: AdminEntityKey,
  id: string
): AssistantApiResponse {
  const def = getEntityDef(entity);
  if (!def.detailPath) {
    return resolveListEntity(entity);
  }
  return {
    message: `J'ouvre ${def.label} ${id.slice(0, 8)}…`,
    action: { type: "OPEN_ENTITY", entity, id },
  };
}

export function entityPath(entity: AdminEntityKey, id?: string): string {
  if (id) {
    const detail = entityDetailPath(entity, id);
    if (detail) return detail;
  }
  return entityListPath(entity);
}
