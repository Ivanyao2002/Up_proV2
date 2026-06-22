import type { NavGroup } from "@/portals/shared/navTypes";

export const SUPPORT_NAV: NavGroup[] = [
  {
    group: "SUPPORT",
    items: [
      {
        label: "Tableau de bord",
        path: "/support",
        icon: "dashboard",
        permission: "support.tickets.view",
      },
      {
        label: "Tickets",
        path: "/support/tickets",
        icon: "support",
        permission: "support.tickets.view",
      },
      {
        label: "Chat franchises",
        path: "/support/chat",
        icon: "chat",
        permission: "support.chat.view",
      },
    ],
  },
  {
    group: "ANOMALIES",
    items: [
      {
        label: "Centre anomalies",
        path: "/support/anomalies",
        icon: "crisis",
        permission: "support.anomalies.view",
      },
      {
        label: "Journal d'audit",
        path: "/support/anomalies/audit",
        icon: "reports",
        permission: "support.anomalies.view",
      },
    ],
  },
];
