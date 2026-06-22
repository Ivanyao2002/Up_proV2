/**
 * Ordre du guide = ordre de la sidebar (adminNav.ts / comptaNav.ts).
 * Les sous-pages (new, edit, détail) suivent leur page parente.
 */

/** @type {Record<string, { group: string; paths: string[] }[]>} */
export const PORTAL_NAV = {
  admin: [
    {
      group: "Connexion",
      paths: ["/admin/login", "/admin", "/admin/forgot-password"],
    },
    {
      group: "OPÉRATIONS",
      paths: [
        "/admin/dashboard",
        "/admin/ops/map",
        "/admin/ops/trips",
        "/admin/ops/sos",
        "/admin/ops/sos/incidents",
        "/admin/ops/dispatch",
        "/admin/ops/crisis",
      ],
    },
    {
      group: "RÉSEAU",
      paths: [
        "/admin/network/franchises",
        "/admin/network/zones",
        "/admin/network/partners",
        "/admin/network/accountants",
      ],
    },
    {
      group: "FLOTTE",
      paths: [
        "/admin/fleet/drivers",
        "/admin/fleet/vehicles",
        "/admin/fleet/kyc",
        "/admin/fleet/clients",
      ],
    },
    {
      group: "FINANCE",
      paths: [
        "/admin/finance",
        "/admin/finance/transactions",
        "/admin/finance/withdrawals",
        "/admin/finance/wallets",
        "/admin/finance/ledger",
        "/admin/finance/driver-transfers",
        "/admin/finance/commissions",
        "/admin/finance/commission-rules",
        "/admin/finance/bonus-rules",
        "/admin/finance/reconciliation",
      ],
    },
    {
      group: "MARKETING",
      paths: [
        "/admin/marketing/promos",
        "/admin/marketing/campaigns",
        "/admin/marketing/banners",
      ],
    },
    {
      group: "SUPPORT",
      paths: [
        "/admin/support/tickets",
        "/admin/support/chat",
        "/admin/support/disputes",
      ],
    },
    {
      group: "PARAMÈTRES",
      paths: [
        "/admin/settings/dispatch-rules",
        "/admin/settings/roles",
        "/admin/settings/pricing",
        "/admin/settings/finance-caps",
        "/admin/settings/integrations",
        "/admin/settings/weather",
        "/admin/settings/audit",
        "/admin/settings/general",
        "/admin/settings/dispatchers",
      ],
    },
  ],
  compta: [
    {
      group: "Connexion",
      paths: ["/compta/login"],
    },
    {
      group: "COMPTABILITÉ",
      paths: [
        "/compta",
        "/compta/flows",
        "/compta/ledger",
        "/compta/commissions",
        "/compta/wallets",
        "/compta/reconciliation",
        "/compta/periods",
      ],
    },
    {
      group: "CONSULTATION",
      paths: [
        "/compta/transactions",
        "/compta/withdrawals",
        "/compta/recharges",
      ],
    },
    {
      group: "ACTIONS",
      paths: ["/compta/exports"],
    },
  ],
};

const PORTAL_ORDER = ["admin", "compta"];

function subPathSortKey(subPath) {
  if (!subPath) return 0;
  const parts = subPath.split("/").filter(Boolean);
  if (parts.length === 0) return 0;
  const last = parts[parts.length - 1];

  if (parts.length === 1 && last === "new") return 10;
  if (
    parts.length === 1 &&
    (last === "[id]" || /^[0-9a-f-]{36}$/i.test(last))
  ) {
    return 30;
  }
  if (last === "forensic") return 35;
  if (last === "edit") return 40;
  if (last === "new") return 50;
  if (last === "pending" || last === "moderation" || last === "recurring") {
    return 15;
  }
  return 25 + parts.length;
}

function matchNavEntry(path, portal) {
  const nav = PORTAL_NAV[portal];
  if (!nav) {
    return { groupIdx: 99, pathIdx: 99, subKey: 99, group: "AUTRES" };
  }

  let best = null;

  for (let groupIdx = 0; groupIdx < nav.length; groupIdx++) {
    const { group, paths } = nav[groupIdx];
    for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
      const base = paths[pathIdx];
      if (path === base) {
        const candidate = { groupIdx, pathIdx, subKey: 0, group, baseLen: base.length };
        if (!best || candidate.baseLen > best.baseLen) best = candidate;
      } else if (path.startsWith(`${base}/`)) {
        const sub = path.slice(base.length);
        const candidate = {
          groupIdx,
          pathIdx,
          subKey: subPathSortKey(sub),
          group,
          baseLen: base.length,
        };
        if (!best || candidate.baseLen > best.baseLen) best = candidate;
      }
    }
  }

  if (best) return best;

  // Connexion non listée explicitement
  if (path.includes("/login") || path.includes("forgot-password")) {
    return { groupIdx: 0, pathIdx: 0, subKey: 0, group: "Connexion" };
  }

  return { groupIdx: 99, pathIdx: 99, subKey: 99, group: "AUTRES" };
}

export function getPortalGroupOrder(portal) {
  return PORTAL_NAV[portal]?.map((g) => g.group) ?? [];
}

export function sortGuideModules(modules) {
  return [...modules]
    .map((m) => {
      const sort = matchNavEntry(m.path, m.portal);
      return {
        ...m,
        group: sort.group === "AUTRES" ? m.group : sort.group,
        _sort: sort,
      };
    })
    .sort((a, b) => {
      const pa = PORTAL_ORDER.indexOf(a.portal);
      const pb = PORTAL_ORDER.indexOf(b.portal);
      if (pa !== pb) return pa - pb;
      if (a._sort.groupIdx !== b._sort.groupIdx) {
        return a._sort.groupIdx - b._sort.groupIdx;
      }
      if (a._sort.pathIdx !== b._sort.pathIdx) {
        return a._sort.pathIdx - b._sort.pathIdx;
      }
      if (a._sort.subKey !== b._sort.subKey) {
        return a._sort.subKey - b._sort.subKey;
      }
      return a.path.localeCompare(b.path, "fr");
    })
    .map(({ _sort, ...m }) => m);
}
