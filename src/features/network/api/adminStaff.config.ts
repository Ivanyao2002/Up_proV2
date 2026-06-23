import { LINKS } from "@/core/api/links";

export type AdminStaffKind = "accountant" | "support" | "reporting";

type StaffLinks = {
  list: string;
  create: string;
  getById: (id: string) => string;
  suspend: (id: string) => string;
  activate: (id: string) => string;
};

export interface AdminStaffConfig {
  kind: AdminStaffKind;
  titlePlural: string;
  titleSingular: string;
  listPath: string;
  newPath: string;
  portalLoginPath: string;
  portalCode: string;
  links: StaffLinks;
  listArrayKeys: string[];
  createSuccessMessage: string;
  suspendSuccessMessage: string;
  activateSuccessMessage: string;
  countryHint: string;
}

export const ADMIN_STAFF_CONFIG: Record<AdminStaffKind, AdminStaffConfig> = {
  accountant: {
    kind: "accountant",
    titlePlural: "Comptables",
    titleSingular: "Comptable",
    listPath: "/admin/network/accountants",
    newPath: "/admin/network/accountants/new",
    portalLoginPath: "/compta/login",
    portalCode: "compta",
    links: LINKS.admin.v1.accountants,
    listArrayKeys: ["accountants", "items"],
    createSuccessMessage: "Comptable créé",
    suspendSuccessMessage: "Comptable suspendu",
    activateSuccessMessage: "Comptable réactivé",
    countryHint: "Un comptable par pays — périmètre comptable filtré.",
  },
  support: {
    kind: "support",
    titlePlural: "Agents support",
    titleSingular: "Agent support",
    listPath: "/admin/network/support-agents",
    newPath: "/admin/network/support-agents/new",
    portalLoginPath: "/support/login",
    portalCode: "support",
    links: LINKS.admin.v1.supportAgents,
    listArrayKeys: ["supportAgents", "support_agents", "items"],
    createSuccessMessage: "Agent support créé",
    suspendSuccessMessage: "Agent support suspendu",
    activateSuccessMessage: "Agent support réactivé",
    countryHint: "Périmètre pays obligatoire — tickets et audit sur sa zone.",
  },
  reporting: {
    kind: "reporting",
    titlePlural: "Analystes reporting",
    titleSingular: "Analyste reporting",
    listPath: "/admin/network/reporting-users",
    newPath: "/admin/network/reporting-users/new",
    portalLoginPath: "/reporting/login",
    portalCode: "reporting",
    links: LINKS.admin.v1.reportingUsers,
    listArrayKeys: ["reportingUsers", "reporting_users", "items"],
    createSuccessMessage: "Analyste reporting créé",
    suspendSuccessMessage: "Analyste reporting suspendu",
    activateSuccessMessage: "Analyste reporting réactivé",
    countryHint: "Lecture finance consolidée filtrée sur le pays assigné.",
  },
};

export function getAdminStaffConfig(kind: AdminStaffKind): AdminStaffConfig {
  return ADMIN_STAFF_CONFIG[kind];
}
