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
        label: "Réclamations",
        path: "/support/tickets",
        icon: "support",
        permission: "support.tickets.view",
      },
      {
        label: "Litiges",
        path: "/support/disputes",
        icon: "reports",
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
    group: "SUPERVISION",
    items: [
      {
        label: "Historique réclamations",
        path: "/support/anomalies/audit",
        icon: "reports",
        permission: "support.anomalies.view",
      },
    ],
  },
];
