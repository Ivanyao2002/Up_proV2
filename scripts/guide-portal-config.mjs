import { PORTAL_NAV } from "./guide-nav-order.mjs";
import { discoverAppRoutes } from "./discover-app-routes.mjs";

const SKIP_PATHS = new Set(["/admin", "/admin/forgot-password"]);

function routeToSlug(route) {
  return route
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/-+/g, "-");
}

/** @param {"admin"|"compta"} portal */
export function getGuidePortalMeta(portal) {
  const meta = {
    admin: {
      title: "Guide utilisateur — Portail Admin",
      subtitle: "Back-office UpJunoo Pro · Gestion opérationnelle, réseau, flotte et finance",
      loginPath: "/admin/login",
      homePath: "/admin/dashboard",
      outputDir: "guide-admin",
      htmlName: "guide-utilisateur-admin.html",
      pdfName: "Guide_Utilisateur_Admin_UpJunoo.pdf",
    },
    compta: {
      title: "Guide utilisateur — Portail Comptable",
      subtitle: "Back-office UpJunoo Pro · Consultation financière, journal, réconciliation et exports",
      loginPath: "/compta/login",
      homePath: "/compta",
      outputDir: "guide-compta",
      htmlName: "guide-utilisateur-compta.html",
      pdfName: "Guide_Utilisateur_Compta_UpJunoo.pdf",
    },
  };
  return meta[portal];
}

/** @param {"admin"|"compta"} portal */
export function getGuidePages(portal) {
  const discovered = discoverAppRoutes().filter((r) => r.portal === portal);
  const byPath = new Map(discovered.map((r) => [r.path, r]));
  const nav = PORTAL_NAV[portal] ?? [];
  const pages = [];
  let idx = 1;

  for (const { group, paths } of nav) {
    for (const path of paths) {
      if (SKIP_PATHS.has(path) || path.includes("forgot-password")) continue;
      if (path.endsWith("/login")) continue;

      const auto = byPath.get(path);
      pages.push({
        slug: `${String(idx).padStart(2, "0")}-${routeToSlug(path)}`,
        path,
        group,
        label: auto?.label ?? path.split("/").pop(),
        objectif:
          auto?.objectif ??
          `Accéder à l'écran « ${auto?.label ?? path} » et utiliser les fonctions disponibles.`,
        usage: auto?.usage ?? [
          `Menu latéral → section ${group}.`,
          `Ouvrir ${path}.`,
          "Utiliser filtres, tableaux et actions proposés à l'écran.",
        ],
      });
      idx += 1;
    }
  }

  return pages;
}

export function getGuideCredentials(portal, env = process.env) {
  if (portal === "admin") {
    return {
      email:
        env.GUIDE_ADMIN_EMAIL ??
        env.NEXT_PUBLIC_DEV_ADMIN_EMAIL ??
        env.DEV_ADMIN_EMAIL ??
        "dev.admin@upjunoo-dev.tech",
      password:
        env.GUIDE_ADMIN_PASSWORD ??
        env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD ??
        env.DEV_ADMIN_PASSWORD ??
        "Upjunoo@Dev2026!",
    };
  }
  return {
    email:
      env.GUIDE_COMPTA_EMAIL ??
      (env.GUIDE_COMPTA_USE_DEV_EMAIL === "false"
        ? "comptable@upjunoo.com"
        : "comptable@upjunoo-dev.tech"),
    password: env.GUIDE_COMPTA_PASSWORD ?? "123456789",
  };
}
