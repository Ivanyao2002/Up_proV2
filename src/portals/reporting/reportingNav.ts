import type { NavGroup } from "@/portals/shared/navTypes";

export const REPORTING_NAV: NavGroup[] = [
  {
    group: "REPORTING",
    items: [
      {
        label: "Tableau de bord",
        path: "/reporting",
        icon: "dashboard",
        permission: "reporting.dashboard.view",
      },
      {
        label: "Activité consolidée",
        path: "/reporting/activity",
        icon: "trips",
        permission: "reporting.dashboard.view",
      },
      {
        label: "Rapports & exports",
        path: "/reporting/exports",
        icon: "reports",
        permission: "reporting.exports.view",
      },
    ],
  },
  {
    group: "SOURCES",
    items: [
      {
        label: "Finance opérationnelle",
        path: "/admin/finance",
        icon: "finance",
        permission: "finance.transactions.view",
      },
      {
        label: "Dashboard plateforme",
        path: "/admin/dashboard",
        icon: "dashboard",
        permission: "ops.dashboard.view",
      },
    ],
  },
];
