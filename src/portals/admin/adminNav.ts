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
    ],
  },
];
