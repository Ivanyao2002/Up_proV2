import type { NavGroup } from "@/portals/shared/navTypes";

export const FRANCHISE_NAV: NavGroup[] = [
  {
    group: "OPERATION",
    items: [
      {
        label: "Tableau de bord",
        path: "/franchise/dashboard",
        icon: "dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Carte live",
        path: "/franchise/map",
        icon: "map",
        permission: "ops.map.view",
      },
      {
        label: "Courses",
        path: "/franchise/trips",
        icon: "trips",
        permission: "ops.dashboard.view",
      },
      {
        label: "SOS Guardian",
        path: "/franchise/sos",
        icon: "support",
        permission: "ops.dashboard.view",
      },
      {
        label: "Zones",
        path: "/franchise/zones",
        icon: "territory",
        permission: "ops.dashboard.view",
      },
    ],
  },
  {
    group: "FLOTTE",
    items: [
      {
        label: "Partenaires",
        path: "/franchise/partners",
        icon: "partners",
        permission: "network.partners.view",
      },
      {
        label: "Chauffeurs",
        path: "/franchise/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Véhicules",
        path: "/franchise/fleet/vehicles",
        icon: "fleet",
        permission: "fleet.drivers.view",
      },
      {
        label: "File KYC",
        path: "/franchise/fleet/kyc",
        icon: "drivers-pending",
        permission: "fleet.kyc.approve",
      },
      {
        label: "Clients",
        path: "/franchise/clients",
        icon: "clients",
        permission: "fleet.drivers.view",
      },
    ],
  },
  {
    group: "FINANCE",
    items: [
      {
        label: "Finance locale",
        path: "/franchise/finance",
        icon: "finance",
        permission: "finance.wallets.view",
      },
      {
        label: "Commissions",
        path: "/franchise/finance/commissions",
        icon: "commissions",
        permission: "finance.wallets.view",
      },
      {
        label: "Réconciliation",
        path: "/franchise/finance/reconciliation",
        icon: "reconciliation",
        permission: "finance.wallets.view",
      },
      {
        label: "Recharges partenaires",
        path: "/franchise/finance/partner-transfers",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
      {
        label: "Recharges chauffeurs",
        path: "/franchise/finance/driver-transfers",
        icon: "wallet-transfer",
        permission: "finance.wallets.view",
      },
    ],
  },
  {
    group: "MARKETING",
    items: [
      {
        label: "Codes promo",
        path: "/franchise/promos",
        icon: "promo",
        permission: "ops.dashboard.view",
      },
      {
        label: "Campagnes",
        path: "/franchise/marketing/campaigns",
        icon: "campaigns",
        permission: "ops.dashboard.view",
      },
      {
        label: "Bannières",
        path: "/franchise/marketing/banners",
        icon: "banners",
        permission: "ops.dashboard.view",
      },
    ],
  },
  {
    group: "SUPPORT",
    items: [
      {
        label: "Tickets",
        path: "/franchise/support",
        icon: "support",
        permission: "network.partners.view",
      },
      {
        label: "Chat",
        path: "/franchise/support/chat",
        icon: "chat",
        permission: "network.partners.view",
      },
    ],
  },
  {
    group: "PARAMÈTRES",
    items: [
      {
        label: "Tarification",
        path: "/franchise/pricing",
        icon: "finance",
        permission: "ops.dashboard.view",
      },
      {
        label: "Météo",
        path: "/franchise/settings/weather",
        icon: "map",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Général",
        path: "/franchise/settings/general",
        icon: "settings",
        permission: "settings.dispatchers.view",
      },
    ],
  },
];
