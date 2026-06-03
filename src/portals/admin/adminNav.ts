export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  permission: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    group: "OPÉRATIONS",
    items: [
      {
        label: "Tableau de bord",
        path: "/admin/dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Carte live",
        path: "/admin/ops/map",
        permission: "ops.map.view",
      },
      {
        label: "Courses",
        path: "/admin/ops/trips",
        permission: "ops.trips.view",
      },
      {
        label: "Dispatch",
        path: "/admin/ops/dispatch",
        permission: "ops.dispatch.view",
      },
      {
        label: "Mode crise",
        path: "/admin/ops/crisis",
        permission: "ops.dispatch.view",
      },
    ],
  },
  {
    group: "RÉSEAU",
    items: [
      {
        label: "Franchises",
        path: "/admin/network/franchises",
        permission: "network.franchises.view",
      },
      {
        label: "Zones",
        path: "/admin/network/zones",
        permission: "network.zones.view",
      },
      {
        label: "Partenaires",
        path: "/admin/network/partners",
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
        permission: "fleet.drivers.view",
      },
      {
        label: "File KYC",
        path: "/admin/fleet/kyc",
        permission: "fleet.kyc.approve",
      },
      {
        label: "Clients",
        path: "/admin/fleet/clients",
        permission: "fleet.drivers.view",
      },
    ],
  },
  {
    group: "FINANCE",
    items: [
      {
        label: "Transactions",
        path: "/admin/finance/transactions",
        permission: "finance.transactions.view",
      },
      {
        label: "Retraits",
        path: "/admin/finance/withdrawals",
        permission: "finance.withdrawals.approve",
      },
      {
        label: "Portefeuilles",
        path: "/admin/finance/wallets",
        permission: "finance.transactions.view",
      },
      {
        label: "Commissions",
        path: "/admin/finance/commissions",
        permission: "finance.transactions.view",
      },
      {
        label: "Réconciliation",
        path: "/admin/finance/reconciliation",
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
        permission: "ops.dashboard.view",
      },
      {
        label: "Campagnes",
        path: "/admin/marketing/campaigns",
        permission: "ops.dashboard.view",
      },
      {
        label: "Bannières",
        path: "/admin/marketing/banners",
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
        permission: "ops.trips.view",
      },
    ],
  },
  {
    group: "PARAMÈTRES",
    items: [
      {
        label: "Dispatchers",
        path: "/admin/settings/dispatchers",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Règles de dispatch",
        path: "/admin/settings/dispatch-rules",
        permission: "settings.dispatch_rules.view",
      },
      {
        label: "Rôles",
        path: "/admin/settings/roles",
        permission: "settings.roles.manage",
      },
      {
        label: "Tarification",
        path: "/admin/settings/pricing",
        permission: "settings.pricing.view",
      },
      {
        label: "Intégrations",
        path: "/admin/settings/integrations",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Audit",
        path: "/admin/settings/audit",
        permission: "settings.dispatchers.view",
      },
      {
        label: "Général",
        path: "/admin/settings/general",
        permission: "settings.dispatchers.view",
      },
    ],
  },
];
