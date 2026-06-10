import type { NavGroup } from "@/portals/shared/navTypes";

export type { NavItem, NavGroup } from "@/portals/shared/navTypes";

export const ADMIN_NAV: NavGroup[] = [
  {
    group: "OPÉRATIONS",
    items: [
      {
        label: "Tableau de bord",
        path: "/admin/dashboard",
        icon: "dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Carte live",
        path: "/admin/ops/map",
        icon: "map",
        permission: "ops.map.view",
      },
      {
        label: "Courses",
        path: "/admin/ops/trips",
        icon: "trips",
        permission: "ops.trips.view",
      },
      {
        label: "SOS Guardian",
        path: "/admin/ops/sos",
        icon: "crisis",
        permission: "ops.trips.view",
      },
      // {
      //   label: "Dispatch",
      //   path: "/admin/ops/dispatch",
      //   icon: "dispatch",
      //   permission: "ops.dispatch.view",
      // },
      // {
      //   label: "Mode crise",
      //   path: "/admin/ops/crisis",
      //   icon: "crisis",
      //   permission: "ops.dispatch.view",
      // },
    ],
  },
  {
    group: "RÉSEAU",
    items: [
      {
        label: "Franchises",
        path: "/admin/network/franchises",
        icon: "network",
        permission: "network.franchises.view",
      },
      {
        label: "Zones",
        path: "/admin/network/zones",
        icon: "territory",
        permission: "network.zones.view",
      },
      {
        label: "Partenaires",
        path: "/admin/network/partners",
        icon: "partners",
        permission: "network.partners.view",
      },
    ],
  },
  {
    group: "FLOTTE",
    items: [
      {
        label: "Chauffeurs",
        path: "/admin/fleet/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Véhicules",
        path: "/admin/fleet/vehicles",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "File KYC",
        path: "/admin/fleet/kyc",
        icon: "drivers-pending",
        permission: "fleet.kyc.approve",
      },
      {
        label: "Clients",
        path: "/admin/fleet/clients",
        icon: "clients",
        permission: "fleet.drivers.view",
      },
    ],
  },
  {
    group: "FINANCE",
    items: [
      {
        label: "Finance générale",
        path: "/admin/finance",
        icon: "finance",
        permission: "finance.transactions.view",
      },
      {
        label: "Transactions",
        path: "/admin/finance/transactions",
        icon: "transactions",
        permission: "finance.transactions.view",
      },
      {
        label: "Retraits",
        path: "/admin/finance/withdrawals",
        icon: "withdrawals",
        permission: "finance.withdrawals.approve",
      },
      // {
      //   label: "Portefeuilles",
      //   path: "/admin/finance/wallets",
      //   icon: "wallet",
      //   permission: "finance.transactions.view",
      // },
      {
        label: "Recharges chauffeurs",
        path: "/admin/finance/driver-transfers",
        icon: "wallet-transfer",
        permission: "finance.transactions.view",
      },
      {
        label: "Commissions",
        path: "/admin/finance/commissions",
        icon: "commissions",
        permission: "finance.transactions.view",
      },
      {
        label: "Réconciliation",
        path: "/admin/finance/reconciliation",
        icon: "reconciliation",
        permission: "finance.transactions.view",
      },
    ],
  },
  {
    group: "MARKETING",
    items: [
      {
        label: "Codes promo",
        path: "/admin/marketing/promos",
        icon: "promo",
        permission: "ops.dashboard.view",
      },
      {
        label: "Campagnes",
        path: "/admin/marketing/campaigns",
        icon: "campaigns",
        permission: "ops.dashboard.view",
      },
      {
        label: "Bannières",
        path: "/admin/marketing/banners",
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
        path: "/admin/support/tickets",
        icon: "support",
        permission: "ops.trips.view",
      },
    ],
  },
  {
    group: "PARAMÈTRES",
    items: [
      // {
      //   label: "Dispatchers",
      //   path: "/admin/settings/dispatchers",
      //   icon: "dispatch",
      //   permission: "settings.dispatchers.view",
      // },
      {
        label: "Règles de dispatch",
        path: "/admin/settings/dispatch-rules",
        icon: "trips",
        permission: "settings.dispatch_rules.view",
      },
      {
        label: "Rôles",
        path: "/admin/settings/roles",
        icon: "roles",
        permission: "settings.roles.manage",
      },
      {
        label: "Tarification",
        path: "/admin/settings/pricing",
        icon: "finance",
        permission: "settings.pricing.view",
      },
      {
        label: "Intégrations",
        path: "/admin/settings/integrations",
        icon: "integrations",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Météo",
        path: "/admin/settings/weather",
        icon: "map",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Audit",
        path: "/admin/settings/audit",
        icon: "reports",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Général",
        path: "/admin/settings/general",
        icon: "settings",
        permission: "settings.dispatchers.view",
      },
    ],
  },
];
