import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { LINKS } from "@/core/api/links";
import type { AssistantApiResponse } from "@/features/assistant/types";
import type { RankingMetric, RankingQuery } from "./rankingIntent";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

async function apiGet<T>(path: string, authHeader: string): Promise<T | null> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
      "X-Client-Type": "back-office",
    },
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function partnerName(p: Record<string, unknown>): string {
  return String(p.trade_name ?? p.tradeName ?? p.name ?? p.legal_name ?? "Partenaire");
}

function franchiseName(f: Record<string, unknown>): string {
  return String(f.name ?? f.label ?? f.trade_name ?? f.tradeName ?? "Franchise");
}

function norm(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function driverDisplayName(d: Record<string, unknown>): string {
  const profile = d.profile as Record<string, unknown> | undefined;
  return (
    (profile?.displayName as string) ??
    [d.firstName, d.lastName].filter(Boolean).join(" ") ??
    String(d.driver_code ?? "Chauffeur")
  );
}

async function fetchAllPages<T extends { items?: Record<string, unknown>[]; users?: Record<string, unknown>[] }>(
  basePath: string,
  authHeader: string,
  listKey: "items" | "users" = "items",
  maxPages = 5
): Promise<Record<string, unknown>[]> {
  const collected: Record<string, unknown>[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await apiGet<T>(
      `${basePath}${buildV1ListQuery({ per_page: 100, page })}`,
      authHeader
    );
    const batch = (data?.[listKey] ?? data?.items ?? []) as Record<string, unknown>[];
    collected.push(...batch);
    if (batch.length < 100) break;
  }
  return collected;
}

async function resolveFranchiseId(
  query: string,
  authHeader: string
): Promise<{ id: string; name: string } | null> {
  const franchises = await fetchAllPages(LINKS.admin.v1.franchises, authHeader);
  const q = norm(query);
  const match = franchises.find((f) => {
    const name = norm(franchiseName(f));
    return name.includes(q) || q.includes(name) || q.split(/\s+/).every((t) => name.includes(t));
  });
  if (!match) return null;
  return { id: String(match.id ?? ""), name: franchiseName(match) };
}

async function resolvePartnerId(
  query: string,
  authHeader: string
): Promise<{ id: string; name: string } | null> {
  const partners = await fetchAllPages(LINKS.admin.v1.partners, authHeader);
  const q = norm(query);
  const match = partners.find((p) => norm(partnerName(p)).includes(q) || q.includes(norm(partnerName(p))));
  if (!match) return null;
  return { id: String(match.id ?? ""), name: partnerName(match) };
}

async function fetchRecentOrders(authHeader: string): Promise<Record<string, unknown>[]> {
  const data = await apiGet<{
    rides?: Record<string, unknown>[];
    deliveries?: Record<string, unknown>[];
    items?: Record<string, unknown>[];
  }>(`${LINKS.admin.v1.orders}${buildV1ListQuery({ per_page: 300, page: 1 })}`, authHeader);
  return [...(data?.rides ?? []), ...(data?.deliveries ?? []), ...(data?.items ?? [])];
}

function metricLabel(metric: RankingMetric): string {
  switch (metric) {
    case "completed_orders":
      return "courses terminées";
    case "cancelled_orders":
      return "courses annulées";
    case "trips_count":
      return "nombre de courses";
    case "wallet_balance":
      return "solde wallet";
    case "rating":
      return "note moyenne";
    case "revenue":
      return "chiffre d'affaires";
    case "driver_count":
      return "nombre de chauffeurs";
    default:
      return "score";
  }
}

function formatMetricValue(metric: RankingMetric, value: number): string {
  if (metric === "wallet_balance" || metric === "revenue") {
    return `${value.toLocaleString("fr-FR")} FCFA`;
  }
  if (metric === "rating") return value.toFixed(1);
  if (metric === "cancelled_orders" || metric === "completed_orders") {
    return `${value} course(s)`;
  }
  return String(value);
}

export async function resolveRankingQuery(
  query: RankingQuery,
  authHeader: string
): Promise<AssistantApiResponse> {
  const { entity, metric, limit } = query;
  let scopeLabel = "";

  if (query.scope?.type === "franchise") {
    const franchise = await resolveFranchiseId(query.scope.query, authHeader);
    if (!franchise) {
      return {
        message: `Franchise introuvable pour « ${query.scope.query} ». Précisez le nom (ex. Côte d'Ivoire).`,
        action: { type: "LIST_ENTITY", entity: "franchises" },
      };
    }
    scopeLabel = ` (franchise ${franchise.name})`;
    query = { ...query, scope: { ...query.scope, query: franchise.id } };
  } else if (query.scope?.type === "partner") {
    const partner = await resolvePartnerId(query.scope.query, authHeader);
    if (!partner) {
      return {
        message: `Partenaire introuvable pour « ${query.scope.query} ».`,
        action: { type: "LIST_ENTITY", entity: "partners" },
      };
    }
    scopeLabel = ` (partenaire ${partner.name})`;
    query = { ...query, scope: { ...query.scope, query: partner.id } };
  }

  if (entity === "drivers") {
    return rankDrivers(query, authHeader, scopeLabel);
  }
  if (entity === "clients") {
    return rankClients(query, authHeader, scopeLabel);
  }
  if (entity === "partners") {
    return metric === "revenue"
      ? buildPartnerRevenueRanking(authHeader)
      : buildPartnerPerformanceRanking(authHeader);
  }
  return buildFranchiseRanking(authHeader, limit);
}

async function rankDrivers(
  query: RankingQuery,
  authHeader: string,
  scopeLabel: string
): Promise<AssistantApiResponse> {
  const drivers = await fetchAllPages(LINKS.admin.v1.drivers, authHeader);
  let filtered = drivers;

  if (query.scope?.type === "franchise") {
    filtered = drivers.filter((d) => String(d.franchise_id ?? "") === query.scope!.query);
  } else if (query.scope?.type === "partner") {
    filtered = drivers.filter((d) => String(d.partner_id ?? "") === query.scope!.query);
  }

  if (!filtered.length) {
    return {
      message: `Aucun chauffeur trouvé${scopeLabel} pour ce classement.`,
      action: null,
    };
  }

  const orders =
    query.metric === "cancelled_orders" ? await fetchRecentOrders(authHeader) : [];
  const cancelledByDriver = new Map<string, number>();
  for (const o of orders) {
    const status = String(o.status ?? "").toLowerCase();
    if (!status.includes("cancel")) continue;
    const id = String(o.driver_id ?? o.driverId ?? "");
    if (!id) continue;
    cancelledByDriver.set(id, (cancelledByDriver.get(id) ?? 0) + 1);
  }

  const ranked = filtered
    .map((d) => {
      const id = String(d.id ?? "");
      let value = 0;
      switch (query.metric) {
        case "completed_orders":
          value = Number(d.total_completed_orders ?? 0);
          break;
        case "cancelled_orders":
          value =
            cancelledByDriver.get(id) ??
            Math.round(
              Number(d.total_completed_orders ?? 0) * Number(d.cancellation_rate ?? 0)
            );
          break;
        case "rating":
          value = Number(d.rating_avg ?? 0);
          break;
        default:
          value = Number(d.total_completed_orders ?? 0);
      }
      return { id, name: driverDisplayName(d), value };
    })
    .filter((d) => d.value > 0 || query.metric === "rating")
    .sort((a, b) => b.value - a.value);

  if (!ranked.length) {
    return {
      message: `Pas assez de données pour classer les chauffeurs${scopeLabel} (${metricLabel(query.metric)}).`,
      action: null,
    };
  }

  const top = ranked[0]!;
  const lines = ranked.slice(0, query.limit).map(
    (d, i) => `${i + 1}. ${d.name} — ${formatMetricValue(query.metric, d.value)}`
  );

  return {
    message: [
      `Meilleur chauffeur${scopeLabel} (${metricLabel(query.metric)}) : ${top.name} (${formatMetricValue(query.metric, top.value)}).`,
      "",
      `Top ${Math.min(query.limit, ranked.length)} :`,
      ...lines,
      query.metric === "cancelled_orders"
        ? "\n(Basé sur l'échantillon récent de courses + taux d'annulation.)"
        : "",
    ].join("\n"),
    action: top.id ? { type: "OPEN_ENTITY", entity: "drivers", id: top.id } : null,
  };
}

async function rankClients(
  query: RankingQuery,
  authHeader: string,
  scopeLabel: string
): Promise<AssistantApiResponse> {
  const users = await fetchAllPages<{
    users?: Record<string, unknown>[];
    items?: Record<string, unknown>[];
  }>(LINKS.admin.v1.users, authHeader, "users");

  const clients = users.filter(
    (u) => String(u.userType ?? "CLIENT").toUpperCase() === "CLIENT"
  );

  const orders =
    query.metric === "cancelled_orders" ? await fetchRecentOrders(authHeader) : [];
  const cancelledByClient = new Map<string, number>();
  for (const o of orders) {
    const status = String(o.status ?? "").toLowerCase();
    if (!status.includes("cancel")) continue;
    const id = String(o.client_id ?? o.clientId ?? "");
    if (!id) continue;
    cancelledByClient.set(id, (cancelledByClient.get(id) ?? 0) + 1);
  }

  const ranked = clients
    .map((c) => {
      const id = String(c.id ?? "");
      let value = 0;
      switch (query.metric) {
        case "wallet_balance":
          value = Number(c.walletBalanceXof ?? c.wallet_balance_fcfa ?? 0);
          break;
        case "cancelled_orders":
          value = cancelledByClient.get(id) ?? 0;
          break;
        case "trips_count":
        default:
          value = Number(c.tripsCount ?? c.trips_count ?? 0);
      }
      return {
        id,
        name: String(c.fullName ?? c.full_name ?? c.email ?? `Client ${id.slice(0, 8)}`),
        value,
      };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  if (!ranked.length) {
    return { message: `Aucun client avec des données${scopeLabel}.`, action: null };
  }

  const top = ranked[0]!;
  const lines = ranked.slice(0, query.limit).map(
    (c, i) => `${i + 1}. ${c.name} — ${formatMetricValue(query.metric, c.value)}`
  );

  return {
    message: [
      `Meilleur client${scopeLabel} (${metricLabel(query.metric)}) : ${top.name} (${formatMetricValue(query.metric, top.value)}).`,
      "",
      `Top ${Math.min(query.limit, ranked.length)} :`,
      ...lines,
    ].join("\n"),
    action: top.id ? { type: "OPEN_ENTITY", entity: "clients", id: top.id } : null,
  };
}

async function buildFranchiseRanking(
  authHeader: string,
  limit: number
): Promise<AssistantApiResponse> {
  const franchises = await fetchAllPages(LINKS.admin.v1.franchises, authHeader);
  const drivers = await fetchAllPages(LINKS.admin.v1.drivers, authHeader);

  const driverCountByFranchise = new Map<string, number>();
  for (const d of drivers) {
    const fid = String(d.franchise_id ?? "");
    if (!fid) continue;
    driverCountByFranchise.set(fid, (driverCountByFranchise.get(fid) ?? 0) + 1);
  }

  const ranked = franchises
    .map((f) => {
      const id = String(f.id ?? "");
      return {
        id,
        name: franchiseName(f),
        value: driverCountByFranchise.get(id) ?? Number(f.driversCount ?? 0),
      };
    })
    .sort((a, b) => b.value - a.value);

  if (!ranked.length) {
    return { message: "Aucune franchise trouvée.", action: null };
  }

  const top = ranked[0]!;
  const lines = ranked.slice(0, limit).map(
    (f, i) => `${i + 1}. ${f.name} — ${f.value} chauffeur(s)`
  );

  return {
    message: [
      `Franchise la plus fournie en chauffeurs : ${top.name} (${top.value} chauffeur(s)).`,
      "",
      `Top ${Math.min(limit, ranked.length)} :`,
      ...lines,
    ].join("\n"),
    action: top.id ? { type: "OPEN_ENTITY", entity: "franchises", id: top.id } : null,
  };
}

export async function buildPartnerPerformanceRanking(
  authHeader: string
): Promise<AssistantApiResponse> {
  const data = await apiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.partners}${buildV1ListQuery({ per_page: 100, page: 1 })}`,
    authHeader
  );

  const items = data?.items ?? [];
  if (!items.length) {
    return {
      message: "Aucun partenaire trouvé pour établir un classement.",
      action: null,
    };
  }

  const ranked = items
    .map((p) => ({
      id: String(p.id ?? ""),
      name: partnerName(p),
      city: String(p.cityLabel ?? p.city ?? "—"),
      drivers: Number(p.driversCount ?? 0),
      status: String(p.status ?? "—"),
    }))
    .sort((a, b) => b.drivers - a.drivers);

  const top = ranked[0]!;
  const lines = ranked.slice(0, 5).map(
    (p, i) =>
      `${i + 1}. ${p.name} — ${p.drivers} chauffeur(s), ville ${p.city}, statut ${p.status}`
  );

  return {
    message: [
      `Partenaire le plus fourni en chauffeurs : ${top.name} (${top.drivers} chauffeur(s)).`,
      "",
      "Top 5 (critère : nombre de chauffeurs — proxy de taille d'activité) :",
      ...lines,
      "",
      "Pour le chiffre d'affaires exact, ouvrez la fiche partenaire (courses + wallet).",
    ].join("\n"),
    action: top.id
      ? { type: "OPEN_ENTITY", entity: "partners", id: top.id }
      : { type: "LIST_ENTITY", entity: "partners" },
  };
}

export async function buildDriverPerformanceRanking(
  authHeader: string
): Promise<AssistantApiResponse> {
  const data = await apiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.drivers}${buildV1ListQuery({ per_page: 100, page: 1 })}`,
    authHeader
  );

  const items = data?.items ?? [];
  if (!items.length) {
    return { message: "Aucun chauffeur trouvé.", action: null };
  }

  const ranked = items
    .map((d) => {
      const profile = d.profile as Record<string, unknown> | undefined;
      const name =
        (profile?.displayName as string) ??
        [d.firstName, d.lastName].filter(Boolean).join(" ") ??
        String(d.driver_code ?? "Chauffeur");
      return {
        id: String(d.id ?? ""),
        name,
        orders: Number(d.total_completed_orders ?? 0),
        rating: d.rating_avg != null ? Number(d.rating_avg) : null,
        availability: String(d.availability ?? d.availability_status ?? "—"),
      };
    })
    .sort((a, b) => b.orders - a.orders || (b.rating ?? 0) - (a.rating ?? 0));

  const top = ranked[0]!;
  const lines = ranked.slice(0, 5).map((d, i) => {
    const rating = d.rating != null ? `, note ${d.rating.toFixed(1)}` : "";
    return `${i + 1}. ${d.name} — ${d.orders} course(s) terminée(s)${rating}, ${d.availability}`;
  });

  return {
    message: [
      `Chauffeur le plus actif (courses terminées) : ${top.name} (${top.orders} course(s)).`,
      "",
      "Top 5 :",
      ...lines,
    ].join("\n"),
    action: top.id
      ? { type: "OPEN_ENTITY", entity: "drivers", id: top.id }
      : { type: "LIST_ENTITY", entity: "drivers" },
  };
}

export async function buildPartnerRevenueRanking(
  authHeader: string
): Promise<AssistantApiResponse> {
  const [partnersData, ordersData] = await Promise.all([
    apiGet<{ items?: Record<string, unknown>[] }>(
      `${LINKS.admin.v1.partners}${buildV1ListQuery({ per_page: 50, page: 1 })}`,
      authHeader
    ),
    apiGet<{
      rides?: Record<string, unknown>[];
      deliveries?: Record<string, unknown>[];
    }>(
      `${LINKS.admin.v1.orders}${buildV1ListQuery({ per_page: 200, page: 1 })}`,
      authHeader
    ),
  ]);

  const partners = partnersData?.items ?? [];
  const orders = [
    ...(ordersData?.rides ?? []),
    ...(ordersData?.deliveries ?? []),
  ];

  const revenueByPartner = new Map<string, number>();
  const completedByPartner = new Map<string, number>();

  for (const o of orders) {
    const status = String(o.status ?? "").toLowerCase();
    if (!status.includes("complete") && status !== "completed") continue;
    const pid = String(o.partner_id ?? o.partnerId ?? "");
    if (!pid) continue;
    const amount = Number(
      o.final_price_xof ?? o.estimated_price_xof ?? o.amount_xof ?? 0
    );
    revenueByPartner.set(pid, (revenueByPartner.get(pid) ?? 0) + amount);
    completedByPartner.set(pid, (completedByPartner.get(pid) ?? 0) + 1);
  }

  const ranked = partners
    .map((p) => {
      const id = String(p.id ?? "");
      return {
        id,
        name: partnerName(p),
        revenue: revenueByPartner.get(id) ?? 0,
        completed: completedByPartner.get(id) ?? 0,
        drivers: Number(p.driversCount ?? 0),
      };
    })
    .filter((p) => p.revenue > 0 || p.completed > 0)
    .sort((a, b) => b.revenue - a.revenue || b.completed - a.completed);

  if (!ranked.length) {
    return buildPartnerPerformanceRanking(authHeader);
  }

  const top = ranked[0]!;
  const lines = ranked.slice(0, 5).map(
    (p, i) =>
      `${i + 1}. ${p.name} — ${p.revenue.toLocaleString("fr-FR")} FCFA (${p.completed} course(s))`
  );

  return {
    message: [
      `Partenaire avec le plus de CA (échantillon récent) : ${top.name} (${top.revenue.toLocaleString("fr-FR")} FCFA).`,
      "",
      "Top 5 par chiffre d'affaires :",
      ...lines,
    ].join("\n"),
    action: top.id
      ? { type: "OPEN_ENTITY", entity: "partners", id: top.id }
      : { type: "LIST_ENTITY", entity: "partners" },
  };
}

export async function resolveAnalyticsQuery(
  kind: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  switch (kind) {
    case "partner_performance":
      return buildPartnerPerformanceRanking(authHeader);
    case "partner_revenue":
      return buildPartnerRevenueRanking(authHeader);
    case "driver_performance":
      return buildDriverPerformanceRanking(authHeader);
    default:
      return {
        message: "Analyse non disponible pour cette question.",
        action: null,
      };
  }
}
