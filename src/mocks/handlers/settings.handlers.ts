import { http, HttpResponse } from "msw";
import dispatchersSeed from "../data/dispatchers-list.json";
import dispatchRulesSeed from "../data/dispatch-rules.json";
import zonesList from "../data/zones-list.json";
import franchisesList from "../data/franchises-list.json";
import rolesListSeed from "../data/roles-list.json";
import pricingListSeed from "../data/pricing-list.json";
import settingsIntegrationsSeed from "../data/settings-integrations.json";
import settingsAuditSeed from "../data/settings-audit-log.json";
import settingsGeneralSeed from "../data/settings-general.json";
import type {
  DispatcherAccount,
  DispatcherAccountDetail,
  DispatchRules,
  AdminRole,
  PricingRule,
  Paginated,
} from "@/shared/types";

interface DispatcherListResponse {
  data: DispatcherAccount[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
}

let dispatchersState: DispatcherListResponse = {
  data: dispatchersSeed.data as DispatcherAccount[],
  meta: dispatchersSeed.meta,
};
let rulesState: DispatchRules = {
  ...(dispatchRulesSeed as DispatchRules),
};

let rolesState: Paginated<AdminRole> = {
  data: rolesListSeed.data as AdminRole[],
  meta: rolesListSeed.meta,
};

let pricingState: Paginated<PricingRule> = {
  data: pricingListSeed.data as PricingRule[],
  meta: pricingListSeed.meta,
};

type IntegrationRow = (typeof settingsIntegrationsSeed.data)[0];
let integrationsState: IntegrationRow[] = [...settingsIntegrationsSeed.data];
let generalState = { ...settingsGeneralSeed };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function defaultPermissionGroups(): AdminRole["permission_groups"] {
  return [
    {
      module: "Opérations",
      permissions: [
        { key: "ops.dashboard.view", label: "Tableau de bord", enabled: true },
        { key: "ops.map.view", label: "Carte live", enabled: false },
        { key: "ops.trips.view", label: "Courses", enabled: true },
        { key: "ops.dispatch.view", label: "Console dispatch", enabled: false },
        { key: "ops.dispatch.assign", label: "Assigner courses", enabled: false },
      ],
    },
    {
      module: "Paramètres",
      permissions: [
        { key: "settings.dispatchers.view", label: "Dispatchers", enabled: false },
        { key: "settings.dispatch_rules.view", label: "Règles dispatch", enabled: false },
        { key: "settings.roles.manage", label: "Gérer les rôles", enabled: false },
      ],
    },
  ];
}

function zoneNames(ids: number[]): string[] {
  return ids
    .map((id) => zonesList.data.find((z) => z.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

function franchiseName(id?: number): string | undefined {
  if (!id) return undefined;
  return franchisesList.data.find((f) => f.id === id)?.name;
}

function toDetail(row: DispatcherAccount): DispatcherAccountDetail {
  const base = dispatchersState.data.find((d) => d.id === row.id);
  return {
    ...row,
    shift_label: base?.id === 1 ? "06h – 14h" : base?.id === 2 ? "14h – 22h" : "08h – 16h",
    permissions: {
      assign_trips: row.status === "active",
      view_live_map: true,
    },
  };
}

function nextId(): number {
  const ids = dispatchersState.data.map((d) => d.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

export const settingsHandlers = [
  http.get("*/api/v2/admin/dispatchers", () => {
    return HttpResponse.json(dispatchersState);
  }),

  http.get("*/api/v2/admin/dispatchers/:id", ({ params }) => {
    const id = Number(params.id);
    const row = dispatchersState.data.find((d) => d.id === id);
    if (!row) {
      return HttpResponse.json({ message: "Dispatcher introuvable" }, { status: 404 });
    }
    return HttpResponse.json(toDetail(row));
  }),

  http.post("*/api/v2/admin/dispatchers", async ({ request }) => {
    const body = (await request.json()) as Partial<DispatcherAccountDetail> & {
      password?: string;
    };
    const zone_ids = body.zone_ids ?? [];
    if (!body.email || !body.name || zone_ids.length === 0) {
      return HttpResponse.json(
        { message: "Email, nom et au moins une zone requis" },
        { status: 422 }
      );
    }
    const exists = dispatchersState.data.some(
      (d) => d.email.toLowerCase() === body.email!.toLowerCase()
    );
    if (exists) {
      return HttpResponse.json({ message: "Cet email est déjà utilisé" }, { status: 422 });
    }
    const row: DispatcherAccount = {
      id: nextId(),
      name: body.name,
      email: body.email,
      phone: body.phone ?? "",
      franchise_id: body.franchise_id,
      franchise_name: franchiseName(body.franchise_id),
      zone_ids,
      zone_names: zoneNames(zone_ids),
      status: (body.status ?? "active") as DispatcherAccount["status"],
      last_login_at: null,
    };
    dispatchersState = {
      ...dispatchersState,
      data: [...dispatchersState.data, row],
      meta: { ...dispatchersState.meta, total: dispatchersState.data.length },
    };
    return HttpResponse.json(toDetail(row), { status: 201 });
  }),

  http.put("*/api/v2/admin/dispatchers/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<DispatcherAccountDetail>;
    const idx = dispatchersState.data.findIndex((d) => d.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Dispatcher introuvable" }, { status: 404 });
    }
    const zone_ids = body.zone_ids ?? dispatchersState.data[idx].zone_ids;
    if (zone_ids.length === 0) {
      return HttpResponse.json({ message: "Au moins une zone requise" }, { status: 422 });
    }
    const updated: DispatcherAccount = {
      ...dispatchersState.data[idx],
      name: body.name ?? dispatchersState.data[idx].name,
      email: body.email ?? dispatchersState.data[idx].email,
      phone: body.phone ?? dispatchersState.data[idx].phone,
      franchise_id: body.franchise_id ?? dispatchersState.data[idx].franchise_id,
      franchise_name: franchiseName(body.franchise_id ?? dispatchersState.data[idx].franchise_id),
      zone_ids,
      zone_names: zoneNames(zone_ids),
      status: (body.status ?? dispatchersState.data[idx].status) as DispatcherAccount["status"],
    };
    const next = [...dispatchersState.data];
    next[idx] = updated;
    dispatchersState = { ...dispatchersState, data: next };
    const detail = toDetail(updated);
    if (body.permissions) detail.permissions = body.permissions;
    if (body.shift_label !== undefined) detail.shift_label = body.shift_label;
    return HttpResponse.json(detail);
  }),

  http.patch("*/api/v2/admin/dispatchers/:id/suspend", ({ params }) => {
    const id = Number(params.id);
    const idx = dispatchersState.data.findIndex((d) => d.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Dispatcher introuvable" }, { status: 404 });
    }
    const row = { ...dispatchersState.data[idx], status: "suspended" as const };
    const next = [...dispatchersState.data];
    next[idx] = row;
    dispatchersState = { ...dispatchersState, data: next };
    return HttpResponse.json(toDetail(row));
  }),

  http.patch("*/api/v2/admin/dispatchers/:id/activate", ({ params }) => {
    const id = Number(params.id);
    const idx = dispatchersState.data.findIndex((d) => d.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Dispatcher introuvable" }, { status: 404 });
    }
    const row = { ...dispatchersState.data[idx], status: "active" as const };
    const next = [...dispatchersState.data];
    next[idx] = row;
    dispatchersState = { ...dispatchersState, data: next };
    return HttpResponse.json(toDetail(row));
  }),

  http.get("*/api/v2/admin/settings/dispatch-rules", () => {
    return HttpResponse.json(rulesState);
  }),

  http.get("*/api/v2/admin/settings/roles", () => {
    return HttpResponse.json(rolesState);
  }),

  http.get("*/api/v2/admin/settings/roles/:id", ({ params }) => {
    const id = Number(params.id);
    const role = rolesState.data.find((r) => r.id === id);
    if (!role) {
      return HttpResponse.json({ message: "Rôle introuvable" }, { status: 404 });
    }
    return HttpResponse.json(role);
  }),

  http.post("*/api/v2/admin/settings/roles", async ({ request }) => {
    const body = (await request.json()) as Partial<AdminRole>;
    if (!body.name?.trim()) {
      return HttpResponse.json({ message: "Nom requis" }, { status: 422 });
    }
    const slug = body.slug?.trim() || slugify(body.name);
    if (rolesState.data.some((r) => r.slug === slug)) {
      return HttpResponse.json({ message: "Ce slug existe déjà" }, { status: 422 });
    }
    const ids = rolesState.data.map((r) => r.id);
    const role: AdminRole = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      name: body.name.trim(),
      slug,
      description: body.description?.trim() ?? "",
      users_count: 0,
      is_system: false,
      permission_groups: body.permission_groups ?? defaultPermissionGroups(),
    };
    rolesState = {
      ...rolesState,
      data: [...rolesState.data, role],
      meta: { ...rolesState.meta, total: rolesState.data.length + 1 },
    };
    return HttpResponse.json(role, { status: 201 });
  }),

  http.put("*/api/v2/admin/settings/roles/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<AdminRole>;
    const idx = rolesState.data.findIndex((r) => r.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Rôle introuvable" }, { status: 404 });
    }
    const current = rolesState.data[idx];
    if (current.is_system && body.permission_groups) {
      return HttpResponse.json(
        { message: "Les rôles système ne peuvent pas être modifiés" },
        { status: 422 }
      );
    }
    const updated: AdminRole = {
      ...current,
      name: body.name?.trim() ?? current.name,
      description: body.description?.trim() ?? current.description,
      permission_groups: body.permission_groups ?? current.permission_groups,
    };
    const next = [...rolesState.data];
    next[idx] = updated;
    rolesState = { ...rolesState, data: next };
    return HttpResponse.json(updated);
  }),

  http.get("*/api/v2/admin/settings/pricing", () => {
    return HttpResponse.json(pricingState);
  }),

  http.get("*/api/v2/admin/settings/pricing/:id", ({ params }) => {
    const id = Number(params.id);
    const rule = pricingState.data.find((p) => p.id === id);
    if (!rule) {
      return HttpResponse.json({ message: "Grille introuvable" }, { status: 404 });
    }
    return HttpResponse.json(rule);
  }),

  http.put("*/api/v2/admin/settings/pricing/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<PricingRule>;
    const idx = pricingState.data.findIndex((p) => p.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Grille introuvable" }, { status: 404 });
    }
    const current = pricingState.data[idx];
    const base_fare_fcfa = body.base_fare_fcfa ?? current.base_fare_fcfa;
    const per_km_fcfa = body.per_km_fcfa ?? current.per_km_fcfa;
    const min_fare_fcfa = body.min_fare_fcfa ?? current.min_fare_fcfa;
    if (base_fare_fcfa <= 0 || per_km_fcfa <= 0 || min_fare_fcfa <= 0) {
      return HttpResponse.json(
        { message: "Les montants doivent être supérieurs à 0" },
        { status: 422 }
      );
    }
    const updated: PricingRule = {
      ...current,
      service: body.service ?? current.service,
      base_fare_fcfa,
      per_km_fcfa,
      min_fare_fcfa,
      surge_multiplier: body.surge_multiplier ?? current.surge_multiplier,
      status: body.status ?? current.status,
    };
    const next = [...pricingState.data];
    next[idx] = updated;
    pricingState = { ...pricingState, data: next };
    return HttpResponse.json(updated);
  }),

  http.post("*/api/v2/admin/settings/pricing", async ({ request }) => {
    const body = (await request.json()) as Partial<PricingRule>;
    if (!body.zone_name?.trim()) {
      return HttpResponse.json({ message: "Zone requise" }, { status: 422 });
    }
    const base_fare_fcfa = body.base_fare_fcfa ?? 500;
    const per_km_fcfa = body.per_km_fcfa ?? 300;
    const min_fare_fcfa = body.min_fare_fcfa ?? 1200;
    if (base_fare_fcfa <= 0 || per_km_fcfa <= 0 || min_fare_fcfa <= 0) {
      return HttpResponse.json(
        { message: "Les montants doivent être supérieurs à 0" },
        { status: 422 }
      );
    }
    const ids = pricingState.data.map((p) => p.id);
    const rule: PricingRule = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      zone_name: body.zone_name.trim(),
      service: body.service ?? "taxi",
      base_fare_fcfa,
      per_km_fcfa,
      min_fare_fcfa,
      surge_multiplier: body.surge_multiplier ?? 1,
      status: body.status ?? "draft",
    };
    pricingState = {
      ...pricingState,
      data: [...pricingState.data, rule],
      meta: { ...pricingState.meta, total: pricingState.data.length + 1 },
    };
    return HttpResponse.json(rule, { status: 201 });
  }),

  http.put("*/api/v2/admin/settings/dispatch-rules", async ({ request }) => {
    const body = (await request.json()) as Partial<DispatchRules>;
    const match_radius_km = body.match_radius_km ?? rulesState.match_radius_km;
    const assign_timeout_sec = body.assign_timeout_sec ?? rulesState.assign_timeout_sec;
    const max_queue_size = body.max_queue_size ?? rulesState.max_queue_size;
    if (match_radius_km <= 0 || assign_timeout_sec <= 0 || max_queue_size <= 0) {
      return HttpResponse.json(
        { message: "Les valeurs numériques doivent être supérieures à 0" },
        { status: 422 }
      );
    }
    rulesState = {
      ...rulesState,
      ...body,
      match_radius_km,
      assign_timeout_sec,
      max_queue_size,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(rulesState);
  }),

  http.get("*/api/v2/admin/settings/integrations", () => {
    return HttpResponse.json({ data: integrationsState });
  }),

  http.patch("*/api/v2/admin/settings/integrations/:id", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { status?: "connected" | "disconnected" };
    const idx = integrationsState.findIndex((i) => i.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Intégration introuvable" }, { status: 404 });
    }
    const updated: IntegrationRow = {
      ...integrationsState[idx],
      status: body.status ?? integrationsState[idx].status,
      last_sync_at:
        body.status === "connected" ? new Date().toISOString() : integrationsState[idx].last_sync_at,
    };
    const next = [...integrationsState];
    next[idx] = updated;
    integrationsState = next;
    return HttpResponse.json(updated);
  }),

  http.get("*/api/v2/admin/settings/audit", () => {
    return HttpResponse.json(settingsAuditSeed);
  }),

  http.get("*/api/v2/admin/settings/general", () => {
    return HttpResponse.json(generalState);
  }),

  http.put("*/api/v2/admin/settings/general", async ({ request }) => {
    const body = (await request.json()) as Partial<typeof generalState>;
    generalState = {
      ...generalState,
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(generalState);
  }),
];
