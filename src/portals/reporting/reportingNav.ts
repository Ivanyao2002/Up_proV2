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
    ],
  },
  {
    group: "ACCÈS RAPIDES",
    items: [
      {
        label: "Activité consolidée",
        path: "/reporting/activity",
        icon: "trips",
        permission: "reporting.activity.view",
      },
      {
        label: "Finance analytique",
        path: "/reporting/finance",
        icon: "finance",
        permission: "reporting.finance.view",
      },
      {
        label: "Qualité & incidents",
        path: "/reporting/quality",
        icon: "support",
        permission: "reporting.quality.view",
      },
      {
        label: "Audit & conformité",
        path: "/reporting/governance",
        icon: "roles",
        permission: "reporting.governance.view",
      },
    ],
  },
  {
    group: "RAPPORTS",
    items: [
      {
        label: "Rapports & exports",
        path: "/reporting/exports",
        icon: "reports",
        permission: "reporting.exports.view",
      },
    ],
  },
];
