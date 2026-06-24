import { LINKS } from "@/core/api/links";
import { isValidEntityFindQuery } from "@/features/assistant/lib/firstEntityIntent";
import { isValidEntityId } from "@/features/assistant/lib/entityId";

export type AdminEntityKey =
  | "dashboard"
  | "map"
  | "trips"
  | "sos"
  | "franchises"
  | "zones"
  | "partners"
  | "drivers"
  | "vehicles"
  | "kyc"
  | "clients"
  | "finance"
  | "transactions"
  | "withdrawals"
  | "driver-transfers"
  | "commissions"
  | "commission-rules"
  | "reconciliation"
  | "promos"
  | "campaigns"
  | "banners"
  | "tickets"
  | "chat"
  | "disputes"
  | "sos-incidents"
  | "roles"
  | "pricing"
  | "dispatch-rules"
  | "integrations"
  | "weather"
  | "audit"
  | "general";

export interface AdminEntityDef {
  key: AdminEntityKey;
  label: string;
  labelPlural: string;
  listPath: string;
  detailPath?: (id: string) => string;
  searchable: boolean;
  listKeywords: RegExp[];
  findKeywords?: RegExp[];
}

export const ADMIN_ENTITIES: AdminEntityDef[] = [
  {
    key: "dashboard",
    label: "tableau de bord",
    labelPlural: "tableau de bord",
    listPath: "/admin/dashboard",
    searchable: false,
    listKeywords: [/tableau de bord|dashboard/i],
  },
  {
    key: "map",
    label: "carte live",
    labelPlural: "carte live",
    listPath: "/admin/ops/map",
    searchable: false,
    listKeywords: [/carte live|live map|carte en direct/i],
  },
  {
    key: "trips",
    label: "course",
    labelPlural: "courses",
    listPath: "/admin/ops/trips",
    detailPath: (id) => `/admin/ops/trips/${id}`,
    searchable: true,
    listKeywords: [/\bcourses\b|\bliste des courses\b/i],
    findKeywords: [/course\s+([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "sos",
    label: "SOS Guardian",
    labelPlural: "SOS Guardian",
    listPath: "/admin/ops/sos",
    searchable: false,
    listKeywords: [/\bsos\b|sos guardian|guardian/i],
  },
  {
    key: "sos-incidents",
    label: "incident SOS",
    labelPlural: "incidents SOS",
    listPath: "/admin/ops/sos/incidents",
    detailPath: (id) => `/admin/ops/sos/incidents/${id}`,
    searchable: true,
    listKeywords: [/incidents?\s+sos|liste des incidents/i],
    findKeywords: [/incident\s+(?:sos\s+)?([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "franchises",
    label: "franchise",
    labelPlural: "franchises",
    listPath: "/admin/network/franchises",
    detailPath: (id) => `/admin/network/franchises/${id}`,
    searchable: true,
    listKeywords: [/\bfranchises\b|\bliste des franchises\b/i],
    findKeywords: [/franchise\s+([A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ\s'-]{1,40})/i],
  },
  {
    key: "zones",
    label: "zone",
    labelPlural: "zones",
    listPath: "/admin/network/zones",
    detailPath: (id) => `/admin/network/zones/${id}`,
    searchable: true,
    listKeywords: [/\bzones\b|\bliste des zones\b/i],
    findKeywords: [/zone\s+([A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ\s'-]{1,40})/i],
  },
  {
    key: "partners",
    label: "partenaire",
    labelPlural: "partenaires",
    listPath: "/admin/network/partners",
    detailPath: (id) => `/admin/network/partners/${id}`,
    searchable: true,
    listKeywords: [/\bpartenaires\b|\bliste des partenaires\b/i],
    findKeywords: [/partenaire\s+([A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ\s'-]{1,40})/i],
  },
  {
    key: "drivers",
    label: "chauffeur",
    labelPlural: "chauffeurs",
    listPath: "/admin/fleet/drivers",
    detailPath: (id) => `/admin/fleet/drivers/${id}`,
    searchable: true,
    listKeywords: [/\bchauffeurs\b|\bliste des chauffeurs\b|\bdrivers\b/i],
    findKeywords: [/chauffeur\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]{1,40})/i],
  },
  {
    key: "vehicles",
    label: "véhicule",
    labelPlural: "véhicules",
    listPath: "/admin/fleet/vehicles",
    detailPath: (id) => `/admin/fleet/vehicles/${id}`,
    searchable: true,
    listKeywords: [
      /\bvéhicules\b|\bvehicules\b|\bliste des véhicules\b/i,
      /\b(?:ouvre|montre|affiche)\s+(?:la\s+)?(?:liste\s+(?:des\s+)?)?véhicules\b/i,
    ],
    findKeywords: [/véhicule\s+([A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ\s'-]{1,40})/i],
  },
  {
    key: "kyc",
    label: "file KYC",
    labelPlural: "file KYC",
    listPath: "/admin/fleet/kyc",
    searchable: false,
    listKeywords: [/\bkyc\b|file kyc|documents kyc/i],
  },
  {
    key: "clients",
    label: "client",
    labelPlural: "clients",
    listPath: "/admin/fleet/clients",
    detailPath: (id) => `/admin/fleet/clients/${id}`,
    searchable: true,
    listKeywords: [/\bclients\b|\bliste des clients\b|\butilisateurs\b/i],
    findKeywords: [/client\s+([A-Za-z0-9À-ÿ@.+][A-Za-z0-9À-ÿ@.\s'-]{1,40})/i],
  },
  {
    key: "finance",
    label: "finance",
    labelPlural: "finance",
    listPath: "/admin/finance",
    searchable: false,
    listKeywords: [/finance générale|finance generale|\bfinance\b/i],
  },
  {
    key: "transactions",
    label: "transaction",
    labelPlural: "transactions",
    listPath: "/admin/finance/transactions",
    detailPath: (id) => `/admin/finance/transactions/${id}`,
    searchable: true,
    listKeywords: [/\btransactions\b|\bliste des transactions\b/i],
    findKeywords: [/transaction\s+([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "withdrawals",
    label: "retrait",
    labelPlural: "retraits",
    listPath: "/admin/finance/withdrawals",
    detailPath: (id) => `/admin/finance/withdrawals/${id}`,
    searchable: true,
    listKeywords: [/\bretraits\b|\bliste des retraits\b/i],
    findKeywords: [/retrait\s+([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "driver-transfers",
    label: "recharge chauffeur",
    labelPlural: "recharges chauffeurs",
    listPath: "/admin/finance/driver-transfers",
    searchable: false,
    listKeywords: [/recharges?\s+chauffeur|driver-transfers|transferts chauffeur/i],
  },
  {
    key: "commissions",
    label: "commission",
    labelPlural: "commissions",
    listPath: "/admin/finance/commissions",
    searchable: false,
    listKeywords: [/\bcommissions\b/i],
  },
  {
    key: "commission-rules",
    label: "règle de commission",
    labelPlural: "règles de commission",
    listPath: "/admin/finance/commission-rules",
    detailPath: (id) => `/admin/finance/commission-rules/${id}/edit`,
    searchable: true,
    listKeywords: [/règles de commission|commission-rules/i],
    findKeywords: [/règle de commission\s+([A-Za-z0-9À-ÿ\s'-]{2,40})/i],
  },
  {
    key: "reconciliation",
    label: "réconciliation",
    labelPlural: "réconciliation",
    listPath: "/admin/finance/reconciliation",
    searchable: false,
    listKeywords: [/réconciliation|reconciliation/i],
  },
  {
    key: "promos",
    label: "code promo",
    labelPlural: "codes promo",
    listPath: "/admin/marketing/promos",
    searchable: true,
    listKeywords: [/codes promo|\bpromos\b|promotions/i],
    findKeywords: [/promo\s+([A-Za-z0-9-]{2,40})/i],
  },
  {
    key: "campaigns",
    label: "campagne",
    labelPlural: "campagnes",
    listPath: "/admin/marketing/campaigns",
    searchable: true,
    listKeywords: [/\bcampagnes\b|\bliste des campagnes\b/i],
    findKeywords: [/campagne\s+([A-Za-z0-9À-ÿ\s'-]{2,40})/i],
  },
  {
    key: "banners",
    label: "bannière",
    labelPlural: "bannières",
    listPath: "/admin/marketing/banners",
    searchable: true,
    listKeywords: [/\bbannières\b|\bbanners\b/i],
    findKeywords: [/bannière\s+([A-Za-z0-9À-ÿ\s'-]{2,40})/i],
  },
  {
    key: "tickets",
    label: "ticket",
    labelPlural: "tickets",
    listPath: "/admin/support/tickets",
    searchable: true,
    listKeywords: [/\btickets\b|\bliste des tickets\b/i],
    findKeywords: [/ticket\s+([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "chat",
    label: "conversation",
    labelPlural: "conversations chat",
    listPath: "/admin/support/chat",
    detailPath: (id) => `/admin/support/chat/${id}`,
    searchable: true,
    listKeywords: [/\bchat\b|conversations? support|support chat/i],
    findKeywords: [/conversation\s+([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "disputes",
    label: "litige",
    labelPlural: "litiges",
    listPath: "/admin/support/tickets",
    detailPath: (id) => `/admin/support/disputes/${id}`,
    searchable: true,
    listKeywords: [/\blitiges\b|\bdisputes\b/i],
    findKeywords: [/litige\s+([A-Za-z0-9-]{4,})/i],
  },
  {
    key: "roles",
    label: "rôle",
    labelPlural: "rôles",
    listPath: "/admin/settings/roles",
    detailPath: (id) => `/admin/settings/roles/${id}`,
    searchable: true,
    listKeywords: [/\brôles\b|\broles\b|\bliste des rôles\b/i],
    findKeywords: [/rôle\s+([A-Za-z0-9À-ÿ\s'-]{2,40})/i],
  },
  {
    key: "pricing",
    label: "grille tarifaire",
    labelPlural: "tarification",
    listPath: "/admin/settings/pricing",
    detailPath: (id) => `/admin/settings/pricing/${id}`,
    searchable: true,
    listKeywords: [/tarification|grilles tarifaires|\bpricing\b|\btarifs\b/i],
    findKeywords: [/tarif\s+([A-Za-z0-9À-ÿ\s'-]{2,40})/i],
  },
  {
    key: "dispatch-rules",
    label: "règle de dispatch",
    labelPlural: "règles de dispatch",
    listPath: "/admin/settings/dispatch-rules",
    searchable: false,
    listKeywords: [/règles de dispatch|dispatch-rules/i],
  },
  {
    key: "integrations",
    label: "intégrations",
    labelPlural: "intégrations",
    listPath: "/admin/settings/integrations",
    searchable: false,
    listKeywords: [/intégrations|integrations/i],
  },
  {
    key: "weather",
    label: "météo",
    labelPlural: "météo",
    listPath: "/admin/settings/weather",
    searchable: false,
    listKeywords: [/météo|meteo|weather/i],
  },
  {
    key: "audit",
    label: "journal d'audit",
    labelPlural: "audit",
    listPath: "/admin/settings/audit",
    searchable: false,
    listKeywords: [/audit|journal d'audit/i],
  },
  {
    key: "general",
    label: "paramètres généraux",
    labelPlural: "paramètres généraux",
    listPath: "/admin/settings/general",
    searchable: false,
    listKeywords: [/paramètres généraux|settings general|général/i],
  },
];

const ENTITY_BY_KEY = new Map(ADMIN_ENTITIES.map((e) => [e.key, e]));

export function getEntityDef(key: AdminEntityKey): AdminEntityDef {
  const def = ENTITY_BY_KEY.get(key);
  if (!def) throw new Error(`Unknown entity: ${key}`);
  return def;
}

export function entityListPath(key: AdminEntityKey): string {
  return getEntityDef(key).listPath;
}

export function entityDetailPath(key: AdminEntityKey, id: string): string | null {
  if (!isValidEntityId(id)) return null;
  const def = getEntityDef(key);
  return def.detailPath?.(id) ?? null;
}

/** Chemins API v1 pour recherche serveur */
export const ENTITY_LIST_API: Partial<
  Record<AdminEntityKey, string>
> = {
  trips: LINKS.admin.v1.orders,
  drivers: LINKS.admin.v1.drivers,
  vehicles: LINKS.admin.v1.vehicles,
  clients: LINKS.admin.v1.users,
  franchises: LINKS.admin.v1.franchises,
  partners: LINKS.admin.v1.partners,
  zones: LINKS.admin.zones.list,
  transactions: LINKS.admin.v1.finance.transactions,
  withdrawals: LINKS.admin.v1.withdrawals,
  promos: LINKS.admin.v1.marketing.promos,
  campaigns: LINKS.admin.v1.marketing.campaigns,
  banners: LINKS.admin.v1.marketing.banners,
  tickets: LINKS.support.tickets.list,
  roles: LINKS.admin.v1.roles,
  pricing: LINKS.admin.v1.pricingRules,
  "commission-rules": LINKS.admin.v1.commissionRules,
  chat: LINKS.admin.v1.chatConversations,
  "sos-incidents": LINKS.admin.v1.safety.sos,
};

export const ENTITY_DETAIL_API: Partial<
  Record<AdminEntityKey, (id: string) => string>
> = {
  trips: LINKS.admin.v1.orderById,
  drivers: LINKS.admin.v1.driverById,
  vehicles: LINKS.v1.vehicles.getById,
  clients: LINKS.admin.v1.userById,
  franchises: LINKS.admin.v1.franchiseById,
  partners: LINKS.admin.v1.partnerById,
  zones: LINKS.admin.zones.getById,
  transactions: LINKS.admin.v1.finance.transactionById,
  withdrawals: LINKS.admin.v1.withdrawalById,
  roles: LINKS.admin.v1.roleById,
  pricing: LINKS.admin.v1.pricingRuleById,
  "commission-rules": LINKS.admin.v1.commissionRuleById,
  "sos-incidents": LINKS.admin.v1.safety.sosById,
  promos: LINKS.admin.v1.marketing.promoById,
  campaigns: LINKS.admin.v1.marketing.campaignById,
  banners: LINKS.admin.v1.marketing.bannerById,
};

export function matchEntityListIntent(text: string): AdminEntityKey | null {
  const lower = text.toLowerCase();
  const wantsList =
    /liste|list|ouvre|ouvrir|montre|affiche|accède|accéder|va |aller|tous les|toutes les|afficher/i.test(
      lower
    );
  if (!wantsList) return null;

  for (const entity of ADMIN_ENTITIES) {
    if (entity.listKeywords.some((re) => re.test(text))) {
      return entity.key;
    }
  }
  return null;
}

export function matchEntityFindIntent(
  text: string
): { entity: AdminEntityKey; query: string } | null {
  if (
    /(?:qui est|meilleur|meilleure|top|classement|plus (?:de|grand)|ranking)/i.test(text) &&
    /(?:chauffeur|client|partenaire|franchise|course|wallet|annul)/i.test(text)
  ) {
    return null;
  }

  for (const entity of ADMIN_ENTITIES) {
    if (!entity.searchable || !entity.findKeywords) continue;
    for (const re of entity.findKeywords) {
      const m = text.match(re);
      const query = m?.[1]?.trim();
      if (query && query.length >= 2 && isValidEntityFindQuery(query)) {
        return { entity: entity.key, query };
      }
    }
  }
  return null;
}
